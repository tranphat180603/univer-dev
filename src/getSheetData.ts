import '@univerjs/design/lib/index.css';

import { Univer, LocaleType, UniverInstanceType, IWorkbookData, SheetTypes, BooleanNumber } from '@univerjs/core';
import { defaultTheme } from '@univerjs/design';
import { UniverDocsPlugin } from '@univerjs/docs';
import { UniverDocsUIPlugin } from '@univerjs/docs-ui';
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula';
import { UniverRenderEnginePlugin } from '@univerjs/engine-render';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';
import { UniverUIPlugin } from '@univerjs/ui';


const _data = {
    id: 'workbook-01',
    locale: LocaleType.ZH_CN,
    name: 'universheet',
    sheetOrder: ['sheet-01', 'sheet-02', 'sheet-03'],
    appVersion: '3.0.0-alpha',
    sheets: {
      'sheet-01': {
        type: SheetTypes.GRID,
        id: 'sheet-01',
        cellData: {
          0: {
            0: {
              v: 'Hello World',
            },
          },
        },
        name: 'sheet1',
        tabColor: 'red',
        hidden: BooleanNumber.FALSE,
        rowCount: 1000,
        columnCount: 20,
        zoomRatio: 1,
        scrollTop: 200,
        scrollLeft: 100,
        defaultColumnWidth: 93,
        defaultRowHeight: 27,
        status: 1,
        showGridlines: 1,
        hideRow: [],
        hideColumn: [],
        rowHeader: {
          width: 46,
          hidden: BooleanNumber.FALSE,
        },
        columnHeader: {
          height: 20,
          hidden: BooleanNumber.FALSE,
        },
        selections: ['A2'],
        rightToLeft: BooleanNumber.FALSE,
        pluginMeta: {},
      },
      'sheet-02': {
        type: SheetTypes.GRID,
        id: 'sheet-02',
        name: 'sheet2',
        cellData: {},
      },
      'sheet-03': {
        type: SheetTypes.GRID,
        id: 'sheet-03',
        name: 'sheet3',
        cellData: {},
      },
    },
}

export class Sheet {
    private univer: Univer | null = null;
    private workbook: any;
    private container: HTMLElement | null = null;
    public init(data: Partial<IWorkbookData> = _data, containerId: string | HTMLElement = 'app'): void {
        // Resolve the container element
        if (typeof containerId === 'string') {
            const el = document.getElementById(containerId);
            if (!el) {
                throw new Error(`Container element with ID '${containerId}' not found.`);
            }
            this.container = el;
        } else {
            this.container = containerId;
        }

        if (!this.container) {
            throw new Error('Container not initialized');
        }

        // Create the Univer instance
        this.univer = new Univer({
            theme: defaultTheme,
            locale: LocaleType.EN_US,
        });

        // Register core plugins
        this.univer.registerPlugin(UniverRenderEnginePlugin);
        this.univer.registerPlugin(UniverFormulaEnginePlugin);
        this.univer.registerPlugin(UniverUIPlugin, {
            container: this.container,
        });

        // Register doc plugins
        this.univer.registerPlugin(UniverDocsPlugin, {
            hasScroll: false,
        });
        this.univer.registerPlugin(UniverDocsUIPlugin);

        // Register sheet plugins
        this.univer.registerPlugin(UniverSheetsPlugin);
        this.univer.registerPlugin(UniverSheetsUIPlugin);
        this.univer.registerPlugin(UniverSheetsFormulaPlugin);

        // Create a new workbook instance
        this.workbook = this.univer.createUnit(UniverInstanceType.UNIVER_SHEET, data);
        if (!this.workbook) {
            throw new Error('Workbook is not initialized');
        }
        this.workbook.save();
        return <div ref={this.container} className="univer-container" />;
    }

    /**
     * Destroy the Univer instance and workbook.
     */
    public destroy(): void {
        // If there's a cleanup method available, call it here
        // this.univer?.dispose();
        this.univer = null;
        this.workbook = null;
        this.container = null;
    }

    /**
     * Get the current workbook data.
     */
    public getData(): IWorkbookData {
        if (!this.workbook) {
            throw new Error('Workbook is not initialized');
        }
        return this.workbook.save();
    }
}
