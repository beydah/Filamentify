import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

let tempDataDir = ""
let server
let baseUrl = ""

function authHeaders() {
  return {
    Authorization: "Bearer test-admin-token",
  }
}

async function request(pathname, init = {}) {
  return fetch(`${baseUrl}${pathname}`, init)
}

async function setup() {
  tempDataDir = mkdtempSync(path.join(tmpdir(), "filamentify-server-"))
  process.env.DATA_DIR = tempDataDir
  process.env.UPLOADS_DIR = "uploads"
  process.env.ADMIN_TOKEN = "test-admin-token"
  process.env.CLIENT_ORIGIN = "http://localhost:5173"

  const { createApp } = await import("../dist/app.js")
  const app = createApp()

  await new Promise((resolve) => {
    server = app.listen(0, () => resolve())
  })

  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
}

async function teardown() {
  const { closeDatabase } = await import("../dist/db.js")
  closeDatabase()

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })

  rmSync(tempDataDir, { recursive: true, force: true })
}

async function runCase(name, callback) {
  await callback()
  console.log(`ok - ${name}`)
}

async function main() {
  await setup()

  try {
    await runCase("rejects unauthenticated admin access", async () => {
      const response = await request("/api/categories")
      assert.equal(response.status, 401)
    })

    await runCase("validates filament payloads", async () => {
      const categoryResponse = await request("/api/categories", {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "PLA" }),
      })

      assert.equal(categoryResponse.status, 201)
      const category = await categoryResponse.json()

      const invalidResponse = await request("/api/filaments", {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId: category.ID,
          name: "Invalid",
          color: "#000000",
          price: 12,
          gram: 40,
          purchaseDate: new Date().toISOString(),
        }),
      })

      assert.equal(invalidResponse.status, 400)
    })

    await runCase("preserves available gram unless reset is requested", async () => {
      const { default: db } = await import("../dist/db.js")

      const categoryId = Number(db.prepare("INSERT INTO Category_TB (Name) VALUES (?)").run("PETG").lastInsertRowid)
      const filamentId = Number(
        db
          .prepare(`
            INSERT INTO Filament_TB (CategoryID, Name, Color, Price, Gram, Available_Gram, PurchaseDate)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `)
          .run(categoryId, "PETG Blue", "#0000ff", 25, 1000, 350, new Date().toISOString()).lastInsertRowid,
      )

      const updateResponse = await request(`/api/filaments/${filamentId}`, {
        method: "PATCH",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId,
          name: "PETG Blue",
          color: "#0000ff",
          price: 30,
          gram: 1200,
          purchaseDate: new Date().toISOString(),
          link: "",
        }),
      })

      assert.equal(updateResponse.status, 200)

      const filament = db.prepare("SELECT Available_Gram FROM Filament_TB WHERE ID = ?").get(filamentId)
      assert.equal(filament.Available_Gram, 350)
    })

    await runCase("rolls back product creation when a relation violates foreign keys", async () => {
      const createResponse = await request("/api/products", {
        method: "POST",
        headers: authHeaders(),
        body: (() => {
          const formData = new FormData()
          formData.append("name", "Broken Product")
          formData.append("description", "Should fail")
          formData.append("price", "20")
          formData.append("stock", "1")
          formData.append("profitMultiplier", "1.5")
          formData.append("materials", JSON.stringify([{ id: 99999, quantity: 1 }]))
          formData.append("models", JSON.stringify([]))
          formData.append("filaments", JSON.stringify([]))
          formData.append("parentId", "")
          formData.append("categoryId", "")
          return formData
        })(),
      })

      assert.equal(createResponse.status, 409)

      const listResponse = await request("/api/products", {
        headers: authHeaders(),
      })
      const products = await listResponse.json()
      assert.equal(products.some((product) => product.Name === "Broken Product"), false)
    })

    await runCase("rejects invalid upload types", async () => {
      const categoryResponse = await request("/api/model-categories", {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Functional" }),
      })
      const category = await categoryResponse.json()

      const formData = new FormData()
      formData.append("categoryId", String(category.ID))
      formData.append("name", "Bad Upload")
      formData.append("gram", "10")
      formData.append("pieceCount", "1")
      formData.append("file", new File(["not a model"], "bad.txt", { type: "text/plain" }))

      const response = await request("/api/models", {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      })

      assert.equal(response.status, 400)
    })
  } finally {
    await teardown()
  }
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
