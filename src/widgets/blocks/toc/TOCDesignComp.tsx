import React, { ReactNode } from "react"
import _ from 'lodash'
import { TOCBlockDef, TOCItem, alterItems, iterateItems } from "./toc"
import { RenderDesignProps, BlockDef } from ".."
import { useState } from "react"
import produce from "immer"
import uuid from "uuid"
import { localize } from "../../localization"
import SplitPane from "./SplitPane"
import { LabeledProperty } from "../../propertyEditors"
import { Select } from "react-library/lib/bootstrap"

/** Designer component for TOC */
export default function TOCDesignComp(props: { 
  blockDef: TOCBlockDef
  renderProps: RenderDesignProps 
}) {
  const { blockDef, renderProps } = props

  // Select first item by default
  const [selectedId, setSelectedId] = useState(blockDef.items[0] ? blockDef.items[0].id : null)

  // Select item
  const handleItemClick = (item: TOCItem) => { setSelectedId(item.id) }

  /** Alter items using an action */
  const alterBlockItems = (action: (draft: TOCItem) => TOCItem | TOCItem[] | undefined | null) => {
    renderProps.store.alterBlock(blockDef.id, produce((bd: TOCBlockDef) => {
      bd.items = alterItems(bd.items, action)
    }))
  }

  const handleAddItem = () => {
    renderProps.store.alterBlock(blockDef.id, produce((bd: TOCBlockDef) => {
      bd.items.push({
        id: uuid(), 
        label: { _base: renderProps.locale, [renderProps.locale]: "New Item" }, 
        children: []
      })
    }))
  }

  const handleHeaderSet = (header: BlockDef | null) => {
    renderProps.store.alterBlock(blockDef.id, produce((bd: TOCBlockDef) => {
      bd.header = header
    }))
  }

  const handleFooterSet = (footer: BlockDef | null) => {
    renderProps.store.alterBlock(blockDef.id, produce((bd: TOCBlockDef) => {
      bd.footer = footer
    }))
  }

  const editItemLabel = (item: TOCItem) => {
    const newlabel = prompt("Enter new label", localize(item.label, renderProps.locale))
    if (!newlabel) {
      return
    }

    alterBlockItems((draft: TOCItem) => {
      if (draft.id === item.id) {
        draft.label._base = renderProps.locale
        draft.label[renderProps.locale] = newlabel
      }
      return draft
    })
  }

  const addChildItem = (itemId: string) => {
    alterBlockItems((item: TOCItem) => {
      if (item.id === itemId) {
        item.children.push({ 
          id: uuid(), 
          label: { _base: renderProps.locale, [renderProps.locale]: "New Item" }, 
          children: []
        })
      }
      return item
    })
  }

  const deleteItem = (itemId: string) => {
    alterBlockItems((item: TOCItem) => item.id === itemId ? null : item)
  }


  // Render the dropdown gear menu to edit an entry
  const renderCaretMenu = (item: TOCItem) => {
    return <CaretMenu items={
      [
        { label: "Edit Label", onClick: () => editItemLabel(item)},
        { label: "Add Subitem", onClick: () => addChildItem(item.id)},
        { label: "Delete", onClick: () => deleteItem(item.id)}
      ]
    }/>
  }

  const renderLeft = () => {
    return <div style={{ padding: 10 }}>
      { renderProps.renderChildBlock(renderProps, blockDef.header, handleHeaderSet) }
      { blockDef.items.map((item, index) => renderItem(blockDef.items, index, 0)) }
      <button type="button" className="btn btn-link btn-xs" onClick={handleAddItem}>
        <i className="fa fa-plus"/> Add Item
      </button>
      { renderProps.renderChildBlock(renderProps, blockDef.footer, handleFooterSet) }
    </div>
  }

  /** Render an item at a specified depth which starts at 0 */
  const renderItem = (items: TOCItem[], index: number, depth: number) => {
    const item = items[index]

    // Determine style of item label
    const itemLabelStyle: React.CSSProperties = {
      padding: 5,
      cursor: "pointer"
    }
    if (depth === 0) {
      itemLabelStyle.fontWeight = "bold"
    }
    if (item.id === selectedId) {
      itemLabelStyle.backgroundColor = "#DDD"
    }

    return <div>
      <div onClick={handleItemClick.bind(null, item)} style={itemLabelStyle}>
        {localize(item.label, renderProps.locale)}
        { renderCaretMenu(item) }
      </div>
      { item.children.length > 0 ? 
        <div style={{ marginLeft: 10 }}>
          { item.children.map((child, index) => renderItem(item.children, index, depth + 1)) }
        </div>
      : null}
    </div>
  }
  
  // Get selected item
  const selectedItem = iterateItems(blockDef.items).find(item => item.id === selectedId)
  const selectedWidgetId = selectedItem ? selectedItem.widgetId : null

  const handleWidgetIdChange = (widgetId: string | null) => {
    alterBlockItems((draft: TOCItem) => {
      if (draft.id === selectedItem!.id) {
        draft.widgetId = widgetId
      }
      return draft
    })
  }

  const renderRight = () => {
    // Create widget options 
    const widgetOptions = _.sortBy(Object.values(props.renderProps.widgetLibrary.widgets).map(w => ({ label: w.name, value: w.id })), "name")

    return (
      <div style={{ padding: 10 }}>
        <LabeledProperty label="Widget">
          <Select value={selectedWidgetId} onChange={handleWidgetIdChange} options={widgetOptions} nullLabel="Select Widget" />
        </LabeledProperty>
      </div>
    )
  }

  // Render overall structure
  return <SplitPane
    left={renderLeft()}
    right={renderRight()}
  />
}

/** Drop down menu that shows as a downward caret */
const CaretMenu = (props: { items: Array<{ label: ReactNode, onClick: () => void }>}) => {
  return <div className="btn-group">
    <button type="button" className="btn btn-link btn-xs dropdown-toggle" data-toggle="dropdown">
      <i className="fa fa-caret-down"/>
    </button>
    <ul className="dropdown-menu">
      { props.items.map((item, index) => {
        return <li key={index}><a onClick={item.onClick}>{item.label}</a></li>
      })}
    </ul>
  </div>    
}