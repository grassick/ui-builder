import * as React from 'react'
import * as uuid from 'uuid/v4'
import { Database } from './Database'
import Expr from './Expr'

export enum DropSide {
  top = "Top",
  bottom = "Bottom",
  left = "Left",
  right = "Right"
}

export interface BlockStore {
  replaceBlock(blockId: string, replaceWith: BlockDef | null): void,
  addBlock(blockDef: BlockDef, parentBlockId: string | null, parentBlockSection: string): void,
  dragAndDropBlock(sourceBlockDef: BlockDef, targetBlockId: string, dropSide: DropSide): void,
}

// Store which throws on any operation
export class NullBlockStore implements BlockStore {
  replaceBlock(blockId: string, replaceWith: BlockDef | null): void {
    throw new Error("Not allowed")
  }  
  addBlock(blockDef: BlockDef, parentBlockId: string | null, parentBlockSection: string): void {
    throw new Error("Not allowed")
  }
  dragAndDropBlock(sourceBlockDef: BlockDef, targetBlockId: string, dropSide: DropSide): void {
    throw new Error("Not allowed")
  }
}

// Block definition
export interface BlockDef {
  id: string     // Unique id (globally)
  type: string,  // Type of the block
  [index: string]: any  // Other props
}

export type CreateBlock = (blockDef: BlockDef) => Block

export interface ContextVar {
  id: string;     // Id of context variable
  name: string;   // Name of context variable
  type: string;   // row, rowset, text, number, date, datetime, enum, enumset, ...
  table?: string;  // table of database (when type = "rowset" or "row")
  aggrOnly?: boolean; // true if only aggregate expressions are allowed (when type = "rowset")
  selectable?: boolean;  // true if row can be selected (when type = "rowset")
}

export interface RenderInstanceProps {
  database: Database,
  contextVars: ContextVar[],
  getContextVarValue(contextVarId: string): any,
  getContextVarExprValue(contextVarId: string, expr: Expr): any,
  onSelectContextVar(contextVarId: string, primaryKey: any): void; // selection call on context var (when type = "rowset" and selectable)

  // Set a filter on a rowset context variable
  setFilter(contextVarId: string, filter: Filter): void;
}

export interface RenderDesignProps {
  contextVars: ContextVar[],
  store: BlockStore,

  // Designer element and all sub-block elements must wrapped using this function
  wrapDesignerElem(blockDef: BlockDef, elem: React.ReactElement<any>): React.ReactElement<any>,

  // Render a placeholder that can be dropped on
  renderPlaceholder(parentBlockId: string, parentBlockSection: string): React.ReactElement<any>
}

export interface RenderEditorProps {
  contextVars: ContextVar[],
  /** locale of the editor (default "en") */
  locale: string
  onChange(blockDef: BlockDef): void,
}

/** A filter that applies to a particular rowset context variable */
export interface Filter {
  id: string, // Unique id of the filter
  memo: any,  // For internal use by the block. Will be passed back unchanged.
  expr: Expr  // Boolean filter expression on the rowset
}

export interface ValidationError {
  message: string
}

export interface BlockInstance extends React.Component {
  validate?(): ValidationError[]
}

export abstract class Block {
  blockDef: BlockDef

  constructor(blockDef: BlockDef) {
    this.blockDef = blockDef
  }

  get id() { return this.blockDef.id; }

  /** Render the block as it looks in design mode */
  abstract renderDesign(props: RenderDesignProps): React.ReactElement<any>

  /** Render a live instance of the block. ref will be called with the block instance */
  abstract renderInstance(props: RenderInstanceProps, ref: (blockInstance: BlockInstance | null) => void): React.ReactElement<any>

  /** Render an optional property editor for the block */
  abstract renderEditor(props: RenderEditorProps): React.ReactElement<any> | null

  /** Get any context variables expressions that this block or any subblocks need */
  abstract getContextVarExprs(contextVarId: string): Expr[] 

  /** Get child blocks */
  abstract getChildBlockDefs(): BlockDef[]

  /** Get initial filters generated by this block */
  abstract getInitialFilters(contextVarId: string): Promise<Filter[]>;
  
  /** Get context variables which are created by this block and available to its children */
  abstract getCreatedContextVars(): ContextVar[]

  /** Make a copy of the block with a new id */
  abstract clone(): BlockDef

  /** Canonicalize the block definition. Should be done after operations on the block are completed */
  abstract canonicalize(): BlockDef | null

  /** Replace/remove the block with the specified id */
  abstract replaceBlock(blockId: string, replacementBlockDef: BlockDef | null): BlockDef | null

  /** Add a block to a parent block. parentBlockSection is block-specific */
  abstract addBlock(addedBlockDef: BlockDef, parentBlockId: string | null, parentBlockSection: any): BlockDef

  /** Drop a block on top of another */
  abstract dropBlock(droppedBlockDef: BlockDef, targetBlockId: string, dropSide: DropSide): BlockDef
}

// Handles logic of a simple dropping of a block on another
export function dropBlock(droppedBlockDef: BlockDef, targetBlockDef: BlockDef, dropSide: DropSide): BlockDef {
  if (dropSide === DropSide.left) {
    return {
      id: uuid(),
      items: [droppedBlockDef, targetBlockDef],
      type: "horizontal"
    }
  }
  if (dropSide === DropSide.right) {
    return {
      id: uuid(),
      items: [targetBlockDef, droppedBlockDef],
      type: "horizontal"
    }
  }
  if (dropSide === DropSide.top) {
    return {
      id: uuid(),
      items: [droppedBlockDef, targetBlockDef],
      type: "vertical"
    }
  }
  if (dropSide === DropSide.bottom) {
    return {
      id: uuid(),
      items: [targetBlockDef, droppedBlockDef],
      type: "vertical"
    }
  }
  throw new Error("Unknown side")
}

export function findBlockAncestry(rootBlockDef: BlockDef, createBlock: CreateBlock, blockId: string): Block[] | null {
  const rootBlock = createBlock(rootBlockDef)

  // Return self if true
  if (rootBlock.id === blockId) {
    return [rootBlock]
  }

  // For each child
  for (const childBlockDef of rootBlock.getChildBlockDefs()) {
    const childAncestry = findBlockAncestry(childBlockDef, createBlock, blockId)
    if (childAncestry) {
      return [rootBlock].concat(childAncestry)
    }
  }

  return null
}