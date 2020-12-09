/**
 * Creates the Account in QuickBooks
 *
 * @param  {object} account - The unsaved account, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Account
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Account.
 */
public createAccount(account: any, callback?: (err, data) => void) {
    return this.wrapPromiseWithOptionalCallback(this.create( 'account', account), callback);
}
/**
 * Creates the Attachable in QuickBooks
 *
 * @param  {object} attachable - The unsaved attachable, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Attachable
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Attachable.
 */
public createAttachable(attachable: any, callback?: (err, data) => void) {
    return this.wrapPromiseWithOptionalCallback(this.create( 'attachable', attachable), callback);
}
/**
 * Creates the Bill in QuickBooks
 *
 * @param  {object} bill - The unsaved bill, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent Bill
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Bill.
 */
public createBill(bill: any, callback?: (err, data) => void) {
    return this.wrapPromiseWithOptionalCallback(this.create( 'bill', bill), callback);
}
/**
 * Creates the BillPayment in QuickBooks
 *
 * @param  {object} billPayment - The unsaved billPayment, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent BillPayment
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent BillPayment.
 */
public createBillPayment(billPayment: any, callback?: (err, data) => void) {
    return this.wrapPromiseWithOptionalCallback(this.create( 'billPayment', billPayment), callback)
}
/**
 * Creates the Class in QuickBooks
 *
 * @param  {object} qbClass - The unsaved class, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent Class
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Class.
 */
public createClass(qbClass: any, callback?: (err, data) => void) {
    return this.wrapPromiseWithOptionalCallback(this.create( 'class', qbClass), callback)
}
/**
 * Creates the CreditMemo in QuickBooks
 *
 * @param  {object} creditMemo - The unsaved CreditMemo, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent CreditMemo
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent CreditMemo.
 */
public createCreditMemo(creditMemo: any, callback?: (err, data) => void) {
    return this.wrapPromiseWithOptionalCallback(this.create( 'creditMemo', creditMemo), callback)
}
/**
 * Creates the Customer in QuickBooks
 *
 * @param  {object} customer - The unsaved Customer, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent Customer
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Customer.
 */
public createCustomer(customer: any, callback?: (err, data) => void) {
    return this.wrapPromiseWithOptionalCallback(this.create( 'customer', customer), callback)
}
/**
 * Creates the Department in QuickBooks
 *
 * @param  {object} department - The unsaved Department, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent Department
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Department.
 */
public createDepartment(department: any, callback?: (err, data) => void) {
    return this.wrapPromiseWithOptionalCallback(this.create( 'department', department), callback)
}
/**
 * Creates the Deposit in QuickBooks
 *
 * @param  {object} deposit - The unsaved Deposit, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent Deposit
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Deposit.
 */
public createDeposit(deposit: any, callback?: (err, data) => void) {
    return this.wrapPromiseWithOptionalCallback(this.create( 'deposit', deposit), callback)
}
/**
 * Creates the Employee in QuickBooks
 *
 * @param  {object} employee - The unsaved Employee, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent Employee
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Employee.
 */
public createEmployee(employee: any, callback?: (err, data) => void) {
    return this.wrapPromiseWithOptionalCallback(this.create( 'employee', employee), callback)
}
/**
 * Creates the Estimate in QuickBooks
 *
 * @param  {object} estimate - The unsaved Estimate, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent Estimate
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Estimate.
 */
public createEstimate(estimate: any, callback?: (err, data) => void) {
    return this.wrapPromiseWithOptionalCallback(this.create( 'estimate', estimate), callback)
}
/**
 * Creates the Invoice in QuickBooks
 *
 * @param  {object} invoice - The unsaved invoice, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent Invoice
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Invoice.
 */
public createInvoice (invoice: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'invoice', invoice), callback);
}
/**
 * Creates the Item in QuickBooks
 *
 * @param  {object} item - The unsaved Item, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent Item
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Item.
 */
public createItem (item: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'item', item), callback);
}
/**
 * Creates the JournalCode in QuickBooks
 *
 * @param  {object} journalCode - The unsaved JournalCode, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent JournalCode
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent JournalCode.
 */
public createJournalCode (journalCode: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'journalCode', journalCode), callback);
}
/**
 * Creates the JournalEntry in QuickBooks
 *
 * @param  {object} journalEntry - The unsaved JournalEntry, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent JournalEntry
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent JournalEntry.
 */
public createJournalEntry (journalEntry: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'journalEntry', journalEntry), callback);
}
/**
 * Creates the Payment in QuickBooks
 *
 * @param  {object} payment - The unsaved Payment, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent Payment
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Payment.
 */
public createPayment (payment: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'payment', payment), callback);
}
/**
 * Creates the PaymentMethod in QuickBooks
 *
 * @param  {object} paymentMethod - The unsaved PaymentMethod, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent PaymentMethod
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent PaymentMethod.
 */
public createPaymentMethod (paymentMethod: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'paymentMethod', paymentMethod), callback);
}
/**
 * Creates the Purchase in QuickBooks
 *
 * @param  {object} purchase - The unsaved Purchase, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent Purchase
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Purchase.
 */
public createPurchase (purchase: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'purchase', purchase), callback);
}
/**
 * Creates the PurchaseOrder in QuickBooks
 *
 * @param  {object} purchaseOrder - The unsaved PurchaseOrder, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent PurchaseOrder
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent PurchaseOrder.
 */
public createPurchaseOrder (purchaseOrder: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'purchaseOrder', purchaseOrder), callback);
}
/**
 * Creates the RefundReceipt in QuickBooks
 *
 * @param  {object} refundReceipt - The unsaved RefundReceipt, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent RefundReceipt
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent RefundReceipt.
 */
public createRefundReceipt (refundReceipt: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'refundReceipt', refundReceipt), callback);
}
/**
 * Creates the SalesReceipt in QuickBooks
 *
 * @param  {object} salesReceipt - The unsaved SalesReceipt, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent SalesReceipt
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent SalesReceipt.
 */
public createSalesReceipt (salesReceipt: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'salesReceipt', salesReceipt), callback);
}

/**
 * Creates the TaxAgency in QuickBooks
 *
 * @param  {object} taxAgency - The unsaved TaxAgency, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent TaxAgency
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent TaxAgency.
 */
public createTaxAgency (taxAgency: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'taxAgency', taxAgency), callback);
}
/**
 * Creates the TaxService in QuickBooks
 *
 * @param  {object} taxService - The unsaved TaxAgency, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent TaxService
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent TaxService.
 */
public createTaxService (taxService: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'taxService', taxService), callback);
}
/**
 * Creates the Term in QuickBooks
 *
 * @param  {object} term - The unsaved Term, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent Term
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Term.
 */
public createTerm (term: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'term', term), callback);
}
/**
 * Creates the TimeActivity in QuickBooks
 *
 * @param  {object} timeActivity - The unsaved TimeActivity, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent TimeActivity
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent TimeActivity.
 */
public createTimeActivity (timeActivity: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'timeActivity', timeActivity), callback);
}
/**
 * Creates the Transfer in QuickBooks
 *
 * @param  {object} transfer - The unsaved Transfer, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent Transfer
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Transfer.
 */
public createTransfer (transfer: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'transfer', transfer), callback);
}
/**
 * Creates the Vendor in QuickBooks
 *
 * @param  {object} vendor - The unsaved Vendor, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent Vendor
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Vendor.
 */
public createVendor (vendor: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'vendor', vendor), callback);
}
/**
 * Creates the VendorCredit in QuickBooks
 *
 * @param  {object} vendorCredit - The unsaved VendorCredit, to be persisted in QuickBooks
 * @param  {function} callback - Optional Callback function which is called with any error and the persistent VendorCredit
 * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent VendorCredit.
 */
public createVendorCredit (vendorCredit: any, callback?: (err, data) => void): Promise<any>|void {
    return this.wrapPromiseWithOptionalCallback(this.create( 'vendorCredit', vendorCredit), callback);
}
