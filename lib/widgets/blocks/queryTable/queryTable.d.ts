/// <reference types="react" />
import { Block, BlockDef, ContextVar, ChildBlock } from '../../blocks';
import { Expr, Schema, LocalizedString, Row } from 'mwater-expressions';
import { OrderBy } from '../../../database/Database';
import { ActionDef } from '../../actions';
import { DesignCtx, InstanceCtx } from '../../../contexts';
export interface QueryTableBlockDef extends BlockDef {
    type: "queryTable";
    /** Determines if one table row contains one or multiple database table rows */
    mode: "singleRow" | "multiRow";
    headers: Array<BlockDef | null>;
    contents: Array<BlockDef | null>;
    /** Id of context variable of rowset for table to use */
    rowsetContextVarId: string | null;
    limit: number | null;
    where: Expr;
    orderBy: OrderBy[] | null;
    /** Action to be executed when row is clicked */
    rowClickAction: ActionDef | null;
    /** Message to display when there are no rows */
    noRowsMessage?: LocalizedString | null;
    /** True to hide headers */
    hideHeaders?: boolean;
    /** Borders (default is "horizontal") */
    borders?: "horizontal" | "all";
    /** Table padding (default is "normal") */
    padding?: "normal" | "compact";
}
export declare class QueryTableBlock extends Block<QueryTableBlockDef> {
    getChildren(contextVars: ContextVar[]): ChildBlock[];
    validate(designCtx: DesignCtx): string | null;
    processChildren(action: (self: BlockDef | null) => BlockDef | null): BlockDef;
    /** Create the context variable used */
    createRowContextVar(rowsetCV: ContextVar): ContextVar;
    getRowContextVarId(): string;
    /** Get list of expressions used in a row by content blocks */
    getRowExprs(contextVars: ContextVar[], ctx: DesignCtx | InstanceCtx): Expr[];
    getContextVarExprs(contextVar: ContextVar, ctx: DesignCtx | InstanceCtx): Expr[];
    /**
     * Get the value of the row context variable for a specific row.
     * Row should have fields e0, e1, etc. to represent expressions. If singleRow mode, should have id field
     * contextVars: includes rowsetCV and row one
     */
    getRowContextVarValue(row: Row, rowExprs: Expr[], schema: Schema, rowsetCV: ContextVar, contextVars: ContextVar[]): any;
    renderDesign(props: DesignCtx): JSX.Element;
    renderInstance(props: InstanceCtx): JSX.Element;
    renderEditor(props: DesignCtx): JSX.Element;
}
