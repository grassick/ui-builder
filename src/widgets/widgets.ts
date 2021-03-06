import { BlockDef, ContextVar } from './blocks';

/** Widget is named and has a single block with a set of context variables specific to this widget */
export interface WidgetDef {
  id: string; // Unique id (globally)
  name: string; // Name of the block component
  description: string; // Description of the block component
  blockDef: BlockDef | null; // Block that it displays
  
  /** Context variables that will be passed to inner block */
  contextVars: ContextVar[]; 

  /** Preview values of context variables. Used only in designer for preview */
  contextVarPreviewValues: { [contextVarId: string]: any }
}

export type LookupWidget = (id: string) => WidgetDef | null
