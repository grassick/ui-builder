import * as React from 'react';
import { BlockDef, RenderDesignProps, RenderInstanceProps, RenderEditorProps, ContextVar, ChildBlock } from '../blocks';
import CompoundBlock from '../CompoundBlock';
/** Floats some content either right or left of main content */
export interface FloatBlockDef extends BlockDef {
    type: "float";
    /** Which way to float the float content */
    direction: "left" | "right";
    /** Which way to vertically align */
    verticalAlign: "top" | "middle" | "bottom";
    /** Main content of block */
    mainContent: BlockDef | null;
    /** Floated content of block */
    floatContent: BlockDef | null;
}
export declare class FloatBlock extends CompoundBlock<FloatBlockDef> {
    getChildren(contextVars: ContextVar[]): ChildBlock[];
    validate(): null;
    processChildren(action: (self: BlockDef | null) => BlockDef | null): BlockDef;
    renderDesign(props: RenderDesignProps): JSX.Element;
    renderInstance(props: RenderInstanceProps): React.ReactElement<any>;
    renderEditor(props: RenderEditorProps): JSX.Element;
}