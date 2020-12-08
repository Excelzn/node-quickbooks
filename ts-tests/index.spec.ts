import { expect } from "chai"
import config from '../config';
import {Quickbooks} from "../src";

describe("Initialization", () => {
    it("can create Quickbooks object", () => {
        const qb = new Quickbooks(config);
        expect(qb).to.not.be.null;
    })
})

describe("CRUD API", () => {
    describe("INVOICES", () => {
        it('can create invoice', (done) => {
            const qb = new Quickbooks(config);
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
            qb.createInvoice(minimalInvoice, (err, invoice) => {
                expect(invoice.DocNumber).to.not.be.null;
                done();
            })
        })
    })
})
