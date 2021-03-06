"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var toc_1 = require("./toc");
var react_1 = require("react");
var localization_1 = require("../../localization");
var SplitPane_1 = __importDefault(require("./SplitPane"));
var react_2 = __importDefault(require("react"));
var PageStackDisplay_1 = require("../../../PageStackDisplay");
/** Instance component for TOC */
function TOCInstanceComp(props) {
    var blockDef = props.blockDef, instanceCtx = props.instanceCtx;
    // Ref to page stack to ensure closed properly
    var pageStackRef = react_1.useRef(null);
    // Select first item with widget by default
    var firstItem = toc_1.iterateItems(blockDef.items).find(function (item) { return item.widgetId; });
    var _a = react_1.useState(firstItem ? firstItem.id : null), selectedId = _a[0], setSelectedId = _a[1];
    // Select item
    var handleItemClick = function (item) {
        // Only allow selecting with content
        if (!item.widgetId) {
            return;
        }
        // Do nothing if same id
        if (item.id == selectedId) {
            return;
        }
        // Close all pages
        if (pageStackRef.current) {
            if (!pageStackRef.current.closeAllPages()) {
                return;
            }
        }
        setSelectedId(item.id);
    };
    /** Render an item at a specified depth which starts at 0 */
    var renderItem = function (items, index, depth) {
        var item = items[index];
        // Determine style of item label
        var itemLabelStyle = {
            padding: 5,
            cursor: item.widgetId ? "pointer" : "default",
            color: item.widgetId ? undefined : "#737373"
        };
        if (depth === 0) {
            itemLabelStyle.fontWeight = "bold";
        }
        if (item.id === selectedId) {
            itemLabelStyle.backgroundColor = "#DDD";
        }
        return react_2.default.createElement("div", null,
            react_2.default.createElement("div", { onClick: handleItemClick.bind(null, item), style: itemLabelStyle }, localization_1.localize(item.label, instanceCtx.locale)),
            item.children.length > 0 ?
                react_2.default.createElement("div", { style: { marginLeft: 10 } }, item.children.map(function (child, index) { return renderItem(item.children, index, depth + 1); }))
                : null);
    };
    var renderLeft = function () {
        return react_2.default.createElement("div", { style: { padding: 10 } },
            react_2.default.createElement("div", { key: "header" }, instanceCtx.renderChildBlock(instanceCtx, blockDef.header)),
            blockDef.items.map(function (item, index) { return renderItem(blockDef.items, index, 0); }),
            react_2.default.createElement("div", { key: "footer" }, instanceCtx.renderChildBlock(instanceCtx, blockDef.footer)));
    };
    // Get selected item
    var selectedItem = toc_1.iterateItems(blockDef.items).find(function (item) { return item.id === selectedId; });
    var selectedWidgetId = selectedItem ? selectedItem.widgetId : null;
    var renderRight = function () {
        if (!selectedId || !selectedWidgetId || !selectedItem) {
            return null;
        }
        // Map context var values
        var mappedContextVarValues = {};
        for (var _i = 0, _a = Object.keys(selectedItem.contextVarMap || {}); _i < _a.length; _i++) {
            var innerContextVarId = _a[_i];
            var outerContextVarId = (selectedItem.contextVarMap || {})[innerContextVarId];
            if (outerContextVarId) {
                mappedContextVarValues[innerContextVarId] = instanceCtx.contextVarValues[outerContextVarId];
            }
            else {
                mappedContextVarValues[innerContextVarId] = null;
            }
        }
        // Include global context variables
        for (var _b = 0, _c = props.instanceCtx.globalContextVars || []; _b < _c.length; _b++) {
            var globalContextVar = _c[_b];
            mappedContextVarValues[globalContextVar.id] = props.instanceCtx.contextVarValues[globalContextVar.id];
        }
        var page = {
            contextVarValues: mappedContextVarValues,
            database: instanceCtx.database,
            type: "normal",
            title: selectedItem.title ? localization_1.localize(selectedItem.title, instanceCtx.locale) : undefined,
            widgetId: selectedWidgetId
        };
        // Create page stack
        return react_2.default.createElement(PageStackDisplay_1.PageStackDisplay, { key: selectedId, baseCtx: props.instanceCtx, initialPage: page, ref: pageStackRef });
    };
    // Render overall structure
    return react_2.default.createElement(SplitPane_1.default, { left: renderLeft(), right: renderRight(), removePadding: blockDef.removePadding || false });
}
exports.default = TOCInstanceComp;
