"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./db"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.json({ message: "Welcome to Filamentify API" });
});
app.get("/items", (req, res) => {
    const items = db_1.default.prepare("SELECT * FROM items").all();
    res.json(items);
});
app.post("/items", (req, res) => {
    const { name, description } = req.body;
    const info = db_1.default.prepare("INSERT INTO items (name, description) VALUES (?, ?)").run(name, description);
    res.status(201).json({ id: info.lastInsertRowid, name, description });
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map