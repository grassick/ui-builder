"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = __importStar(require("react"));
var BlockFactory_1 = __importDefault(require("./widgets/BlockFactory"));
var mwater_expressions_1 = require("mwater-expressions");
var widgetLibrary_1 = require("./designer/widgetLibrary");
var MWaterDataSource_1 = __importDefault(require("mwater-expressions/lib/MWaterDataSource"));
var ActionLibrary_1 = require("./widgets/ActionLibrary");
var _ = __importStar(require("lodash"));
require("bootstrap/dist/css/bootstrap.css");
require("font-awesome/css/font-awesome.css");
require("./Demo.css");
var ReactDOM = __importStar(require("react-dom"));
var blockPaletteEntries_1 = require("./designer/blockPaletteEntries");
var react_dnd_1 = require("react-dnd");
var react_dnd_html5_backend_1 = __importDefault(require("react-dnd-html5-backend"));
var DataSourceDatabase_1 = require("./database/DataSourceDatabase");
var basicBlockFactory = new BlockFactory_1.default();
var defaultWidgetLibrary = {
    widgets: {}
};
var initialWidgetLibrary = JSON.parse(window.localStorage.getItem("widgetLibrary") || "null") || defaultWidgetLibrary;
var client = window.location.search ? window.location.search.substr(1) : null;
var dataSource = new MWaterDataSource_1.default("https://api.mwater.co/v3/", client, { localCaching: false, serverCaching: false });
var actionLibrary = new ActionLibrary_1.ActionLibrary();
var Demo = /** @class */ (function (_super) {
    __extends(Demo, _super);
    function Demo(props) {
        var _this = _super.call(this, props) || this;
        _this.handleWidgetLibraryChange = function (widgetLibrary) {
            _this.setState({ widgetLibrary: widgetLibrary });
            // console.log(JSON.stringify(widgetLibrary, null, 2))
            window.localStorage.setItem("widgetLibrary", JSON.stringify(widgetLibrary));
        };
        _this.handleOpenTabsChange = function (openTabs) {
            _this.setState({ openTabs: openTabs });
            window.localStorage.setItem("openTabs", JSON.stringify(openTabs));
        };
        _this.state = {
            widgetLibrary: initialWidgetLibrary,
            openTabs: _.intersection(JSON.parse(window.localStorage.getItem("openTabs") || "null") || [], _.keys(initialWidgetLibrary.widgets))
        };
        return _this;
    }
    Demo.prototype.componentDidMount = function () {
        var _this = this;
        fetch("https://api.mwater.co/v3/schema?client=" + (client || "")).then(function (req) { return req.json(); }).then(function (json) {
            var schema = new mwater_expressions_1.Schema(json);
            var database = new DataSourceDatabase_1.DataSourceDatabase(schema, dataSource);
            _this.setState({ schema: schema, database: database });
        });
    };
    Demo.prototype.render = function () {
        if (!this.state.schema || !this.state.database) {
            return React.createElement("div", null, "Loading...");
        }
        var baseCtx = {
            widgetLibrary: this.state.widgetLibrary,
            createBlock: basicBlockFactory.createBlock,
            actionLibrary: actionLibrary,
            database: this.state.database,
            schema: this.state.schema,
            dataSource: dataSource,
            locale: "en",
            globalContextVars: [
                { type: "row", table: "users", id: "user", name: "User" }
            ]
        };
        return (React.createElement("div", { style: { padding: 5, height: "100vh" } },
            React.createElement(widgetLibrary_1.WidgetLibraryDesigner, { baseCtx: baseCtx, dataSource: dataSource, openTabs: this.state.openTabs, onOpenTabsChange: this.handleOpenTabsChange, onWidgetLibraryChange: this.handleWidgetLibraryChange, blockPaletteEntries: blockPaletteEntries_1.defaultBlockPaletteEntries })));
    };
    Demo = __decorate([
        react_dnd_1.DragDropContext(react_dnd_html5_backend_1.default)
    ], Demo);
    return Demo;
}(React.Component));
ReactDOM.render(React.createElement(Demo, null), document.getElementById('main'));
