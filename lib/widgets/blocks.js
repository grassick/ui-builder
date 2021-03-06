"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var uuid_1 = require("uuid");
require("./blocks.css");
/** Side on which another block is dropped on a block */
var DropSide;
(function (DropSide) {
    DropSide["top"] = "Top";
    DropSide["bottom"] = "Bottom";
    DropSide["left"] = "Left";
    DropSide["right"] = "Right";
})(DropSide = exports.DropSide || (exports.DropSide = {}));
/** Store which throws on any operation */
var NullBlockStore = /** @class */ (function () {
    function NullBlockStore() {
    }
    NullBlockStore.prototype.alterBlock = function (blockId, action) {
        throw new Error("Not allowed");
    };
    NullBlockStore.prototype.replaceBlock = function (blockDef) {
        throw new Error("Not allowed");
    };
    return NullBlockStore;
}());
exports.NullBlockStore = NullBlockStore;
var Block = /** @class */ (function () {
    function Block(blockDef) {
        this.blockDef = blockDef;
    }
    Object.defineProperty(Block.prototype, "id", {
        get: function () { return this.blockDef.id; },
        enumerable: true,
        configurable: true
    });
    /** Render an optional property editor for the block. This may use bootstrap */
    Block.prototype.renderEditor = function (designCtx) { return null; };
    /** Get any context variables expressions that this block needs (not including child blocks) */
    Block.prototype.getContextVarExprs = function (contextVar, ctx) { return []; };
    /** Get any context variables expressions that this block needs *including* child blocks. Can be overridden */
    Block.prototype.getSubtreeContextVarExprs = function (contextVar, ctx) {
        // Get own exprs
        var ownExprs = this.getContextVarExprs(contextVar, ctx);
        // Append child ones
        for (var _i = 0, _a = this.getChildren(ctx.contextVars); _i < _a.length; _i++) {
            var childBlock = _a[_i];
            var block = ctx.createBlock(childBlock.blockDef);
            ownExprs = ownExprs.concat(block.getSubtreeContextVarExprs(contextVar, ctx));
        }
        return ownExprs;
    };
    /**
     * Processes entire tree, starting at bottom. Allows
     * easy mutation of the tree
     */
    Block.prototype.process = function (createBlock, action) {
        var blockDef = this.processChildren(function (childBlockDef) {
            // Recursively process, starting at bottom
            if (childBlockDef != null) {
                return createBlock(childBlockDef).process(createBlock, action);
            }
            else {
                return null;
            }
        });
        return action(blockDef);
    };
    /** Get initial filters generated by this block. Does not include child blocks */
    Block.prototype.getInitialFilters = function (contextVarId, instanceCtx) { return []; };
    /** Get initial filters generated by this block and any children */
    Block.prototype.getSubtreeInitialFilters = function (contextVarId, instanceCtx) {
        // Get own filters
        var ownFilters = this.getInitialFilters(contextVarId, instanceCtx);
        // Append child ones
        for (var _i = 0, _a = this.getChildren(instanceCtx.contextVars); _i < _a.length; _i++) {
            var childBlock = _a[_i];
            var block = instanceCtx.createBlock(childBlock.blockDef);
            ownFilters = ownFilters.concat(block.getSubtreeInitialFilters(contextVarId, instanceCtx));
        }
        return ownFilters;
    };
    /** Canonicalize the block definition. Should be done after operations on the block are completed. Only alter self, not children */
    Block.prototype.canonicalize = function () {
        return this.blockDef;
    };
    /** Get label to display in designer */
    Block.prototype.getLabel = function () {
        return this.blockDef.type;
    };
    return Block;
}());
exports.Block = Block;
// Handles logic of a simple dropping of a block on another
function dropBlock(droppedBlockDef, targetBlockDef, dropSide) {
    if (dropSide === DropSide.left) {
        return {
            id: uuid_1.v4(),
            items: [droppedBlockDef, targetBlockDef],
            type: "horizontal",
            align: "justify"
        };
    }
    if (dropSide === DropSide.right) {
        return {
            id: uuid_1.v4(),
            items: [targetBlockDef, droppedBlockDef],
            type: "horizontal",
            align: "justify"
        };
    }
    if (dropSide === DropSide.top) {
        return {
            id: uuid_1.v4(),
            items: [droppedBlockDef, targetBlockDef],
            type: "vertical"
        };
    }
    if (dropSide === DropSide.bottom) {
        return {
            id: uuid_1.v4(),
            items: [targetBlockDef, droppedBlockDef],
            type: "vertical"
        };
    }
    throw new Error("Unknown side");
}
exports.dropBlock = dropBlock;
/**
 * Find the entire ancestry (root first) of a block with the specified id
 *
 * @param rootBlockDef root block to search in
 * @param createBlock
 * @param blockId block to find
 * @returns array of child blocks, each with information about which context variables were injected by their parent
 */
function findBlockAncestry(rootBlockDef, createBlock, contextVars, blockId) {
    var rootBlock = createBlock(rootBlockDef);
    // Return self if true
    if (rootBlock.id === blockId) {
        return [{ blockDef: rootBlockDef, contextVars: contextVars }];
    }
    // For each child
    for (var _i = 0, _a = rootBlock.getChildren(contextVars); _i < _a.length; _i++) {
        var childBlock = _a[_i];
        if (childBlock.blockDef) {
            var childAncestry = findBlockAncestry(childBlock.blockDef, createBlock, childBlock.contextVars, blockId);
            if (childAncestry) {
                return [{ blockDef: rootBlockDef, contextVars: contextVars }].concat(childAncestry);
            }
        }
    }
    return null;
}
exports.findBlockAncestry = findBlockAncestry;
/** Get the entire tree of blocks from a root, including context variables for each */
function getBlockTree(rootBlockDef, createBlock, contextVars) {
    var rootChildBlock = { blockDef: rootBlockDef, contextVars: contextVars };
    // Create list including children
    var list = [rootChildBlock];
    // For each child
    for (var _i = 0, _a = createBlock(rootBlockDef).getChildren(contextVars); _i < _a.length; _i++) {
        var childBlock = _a[_i];
        if (childBlock.blockDef) {
            var childTree = getBlockTree(childBlock.blockDef, createBlock, childBlock.contextVars);
            list = list.concat(childTree);
        }
    }
    return list;
}
exports.getBlockTree = getBlockTree;
/** Create the variables as needed by mwater-expressions */
function createExprVariables(contextVar) {
    return contextVar.map(function (cv) {
        switch (cv.type) {
            case "row":
                return { id: cv.id, type: "id", name: { _base: "en", en: cv.name }, idTable: cv.table };
            case "rowset":
                return { id: cv.id, type: "boolean", name: { _base: "en", en: cv.name }, table: cv.table };
        }
        return { id: cv.id, type: cv.type, name: { _base: "en", en: cv.name } };
    });
}
exports.createExprVariables = createExprVariables;
/** Make a duplicate of a block */
function duplicateBlockDef(blockDef, createBlock) {
    return createBlock(blockDef).process(createBlock, function (bd) { return bd ? (__assign(__assign({}, bd), { id: uuid_1.v4() })) : null; });
}
exports.duplicateBlockDef = duplicateBlockDef;
