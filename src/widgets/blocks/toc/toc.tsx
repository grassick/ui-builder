import * as React from 'react'
import * as _ from 'lodash'
import { BlockDef, RenderDesignProps, RenderInstanceProps, ContextVar, ChildBlock } from '../../blocks'
import CompoundBlock from '../../CompoundBlock'
import produce from 'immer'
import { LocalizedString } from 'mwater-expressions'
import TOCDesignComp from './TOCDesignComp'
import TOCInstanceComp from './TOCInstanceComp'

/** Table of contents with nested items each showing a different widget in main area */
export interface TOCBlockDef extends BlockDef {
  type: "toc"

  /** Nestable items in the table of contents */
  items: TOCItem[]

  /** Optional header */
  header: BlockDef | null

  /** Optional footer */
  footer: BlockDef | null
}

/** An item within the table of contents */
export interface TOCItem {
  /** uuid id */
  id: string

  /** Localized label */
  label: LocalizedString

  /** Widget to be displayed when the item is selected */
  widgetId?: string | null

  /** Maps widgets' context variable ids to external ones */
  contextVarMap?: { [internalContextVarId: string]: string }

  /** Any children items */
  children: TOCItem[]
}

/** Create a flat list of all items */
export const iterateItems = (items: TOCItem[]): TOCItem[] => {
  var flatItems: TOCItem[] = []
  for (const item of items) {
    flatItems.push(item)
    flatItems = flatItems.concat(iterateItems(item.children))
  }
  return flatItems
}

/** Alter each item, allowing item to be mutated, replaced (return item or array of items) or deleted (return null) */
export const alterItems = (items: TOCItem[], action: (item: TOCItem) => undefined | null | TOCItem | TOCItem[]): TOCItem[] => {
  const newItems = _.flatten(_.compact(items.map(item => action(item)))) as TOCItem[]

  for (const ni of newItems) {
    ni.children = alterItems(ni.children, action)
  }
  return newItems
}

export class TOCBlock extends CompoundBlock<TOCBlockDef> {
  /** Get child blocks */
  getChildren(contextVars: ContextVar[]): ChildBlock[] {
    // Iterate all 
    return _.compact([this.blockDef.header, this.blockDef.footer])
      .map(bd => ({ blockDef: bd!, contextVars: contextVars }))
  }

  validate() { return null }

  processChildren(action: (self: BlockDef | null) => BlockDef | null): BlockDef {
    // For header and footer
    return produce(this.blockDef, (draft: TOCBlockDef) => {
      draft.header = action(this.blockDef.header)
      draft.footer = action(this.blockDef.footer)
    })
  }

  renderDesign(props: RenderDesignProps) {
    return <TOCDesignComp renderProps={props} blockDef={this.blockDef} />
  }

  renderInstance(props: RenderInstanceProps): React.ReactElement<any> {
    return <TOCInstanceComp renderProps={props} blockDef={this.blockDef} createBlock={this.createBlock} />
  }
}

