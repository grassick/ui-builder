import * as React from "react";
import BlockPaletteItem from "./BlockPaletteItem"
import { CreateBlock } from "../widgets/blocks"
import { Schema, DataSource } from "mwater-expressions"

interface Props {
  createBlock: CreateBlock
  schema: Schema
  dataSource: DataSource
}

export default class BlockPalette extends React.Component<Props> {
  render() {
    const items = [
      { id: "", type: "text", text: { _base: "en", en: "" }, style: "div" },
      { id: "", type: "labeled", label: { _base: "en", en: "" }, child: null },
      { id: "", type: "collapsible", label: { id: "text", type: "text", text: { _base: "en", en: "Collapsible" }, style: "div" }, content: null },
      { id: "", type: "textInput", column: null },
      { id: "", type: "expression", expr: null },
      { id: "", type: "dropdownInput", column: null },
      { 
        id: "", 
        type: "queryTable", 
        headers: [
          { id: "h1", type: "text", text: { _base: "en", en: "Header 1" }, style: "div" },
          { id: "h2", type: "text", text: { _base: "en", en: "Header 2" }, style: "div" }
        ], 
        contents: [null, null] 
      },
      { id: "", type: "search" },
      { id: "", type: "button", label: { _base: "en", en: "Button" }, style: "default", size: "normal" },
    ]

    return (
      <div className="widget-designer-palette">
        { items.map((blockDef, index) => <BlockPaletteItem key={index} blockDef={blockDef} createBlock={this.props.createBlock} schema={this.props.schema} dataSource={this.props.dataSource} />) }
      </div>
    )
  }
}
 