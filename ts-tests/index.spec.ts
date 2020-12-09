import { expect } from "chai"
import config from '../config';
import {QuickBooks} from "../src";

describe("Initialization", () => {
    it("can create Quickbooks object", () => {
        const qb = new QuickBooks(config);
        expect(qb).to.not.be.null;
    })
})

describe("CRUD API", () => {
    describe("INVOICES", () => {
        it('can create invoice with promise api', async (done) => {
            const qb = new QuickBooks(config);
            const minimalInvoice = {
                CustomerRef: {
                    value: "1"
                },
                Line: [
                    {
                        DetailType: "SalesItemLineDetail",
                        Amount: 100.00,
                        SalesItemLineDetail: {
                            ItemRef: {
                                name: "Services",
                                value: "1"
                            }
                        }
                    }
                ]
            }
            const invoice = await qb.createInvoice(minimalInvoice);
            expect(invoice.DocNumber).to.not.be.null;
            done();

        });
        it('can create invoice with callback api', (done) => {
            const qb = new QuickBooks(config);
            const minimalInvoice = {
                CustomerRef: {
                    value: "1"
                },
                Line: [
                    {
                        DetailType: "SalesItemLineDetail",
                        Amount: 100.00,
                        SalesItemLineDetail: {
                            ItemRef: {
                                name: "Services",
                                value: "1"
                            }
                        }
                    }
                ]
            }
            qb.createInvoice(minimalInvoice, ((err, invoice) => {
                expect(invoice.DocNumber).to.not.be.null;
                done();
            }));
        } )
    })
})
