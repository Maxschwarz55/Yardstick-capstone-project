"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const queries_js_1 = require("../db/queries.js");
const testRouter = (0, express_1.Router)();
testRouter.get("/", (req, res) => {
    res.send("hello world");
});
testRouter.get("/db", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const rows = yield (0, queries_js_1.testQuery)();
    res.send(rows);
}));
exports.default = testRouter;
//# sourceMappingURL=TestRouter.js.map