import { LightningElement, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import CONTACT_NAME_FIELD from '@salesforce/schema/Contact.Name';
import CLIENTID_FIELD from '@salesforce/schema/Contact.c4g_Client_ID__c';
import ASSISTANCE_DATE_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Date_of_Assistance__c';
import NUMBER_KIDS_FIELD from '@salesforce/schema/Case.Children_in_Your_Home_0_17__c';
import NUMBER_HOUSEHOLD_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Total_Number_in_Household__c';
import FOOD_ELIGIBLE_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Eligible_for_Food_Pantry_Shopping__c';
import ITEM_DATE_FIELD from '@salesforce/schema/Cares_Center_Item__c.Date_Item_was_Received__c';
import ITEM_ELIGIBLE_FIELD from '@salesforce/schema/Cares_Center_Item__c.Eligible_for_Item__c';
import CARES_BALANCE_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.ACO_Cares_Card__c';
import NO_SHOW_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.No_Show_Formula_for_Scanner__c';

import createCaresCenterAssistance from '@salesforce/apex/createAssistance.createCaresCenterAssistance';
import createCaresCenterItem from '@salesforce/apex/createAssistance.createCaresCenterItem';
import getLastAssistanceDate from '@salesforce/apex/createAssistance.getLastAssistanceDate';
import getTotalNumberInHousehold from '@salesforce/apex/createAssistance.getTotalNumberInHousehold';
import getNumberKidsForSummerFood from '@salesforce/apex/createAssistance.getNumberKidsForSummerFood';
import getLaundryDetergent from '@salesforce/apex/createAssistance.getLaundryDetergent';
import getPaperTowel from '@salesforce/apex/createAssistance.getPaperTowel';
import getToiletPaper from '@salesforce/apex/createAssistance.getToiletPaper';
import getCaresCardBalance from '@salesforce/apex/createAssistance.getCaresCardBalance';
import updateCaresCardBalance from '@salesforce/apex/createAssistance.updateCaresCardBalance';
import getNoShowStatus from '@salesforce/apex/createAssistance.getNoShowStatus';
import getScannedContacts from '@salesforce/apex/createAssistance.getScannedContacts';
import deleteScannedContact from '@salesforce/apex/createAssistance.deleteScannedContact';

const CARES_CENTER_RECORD_TYPE_ID = '012Nt000000plo5IAA';
const CARES_CENTER_EVENT_TYPE = 'Cares Center';

export default class CaresCenterPanel extends LightningElement {
    activeContactId;
    activeContactName;
    activeClientId;

    @api
    get contactId() {
        return this.activeContactId;
    }
    set contactId(value) {
        this.activeContactId = value;
        this.resetTransactionState();
    }

    @api
    get contactName() {
        return this.activeContactName;
    }
    set contactName(value) {
        this.activeContactName = value;
    }

    totalAmount = 0;
    selectedRowsByItem = {};
    caresCenterCheckedOut = false;
    isCompleteTransactionButtonDisabled = false;
    isCaresPanelLocked = false;
    saveDraftValues = [];

    caresCenterData = [];
    laundryDetergentData = [];
    paperTowelData = [];
    toiletPaperData = [];

    caresCenterDateColumns = [
        { label: 'Last Cares Center Visit', fieldName: ASSISTANCE_DATE_FIELD.fieldApiName, type: 'text', resizable: false },
        {
            label: 'Eligible',
            fieldName: FOOD_ELIGIBLE_FIELD.fieldApiName,
            type: 'text',
            resizable: false,
            cellAttributes: { class: { fieldName: 'eligibleClass' } }
        }
    ];

    caresNoShowStatusColumns = [
        { label: 'No Show for Last Visit?', fieldName: NO_SHOW_FIELD.fieldApiName, type: 'text', resizable: false }
    ];

    householdSizeColumns = [
        { label: 'Total # in Household', fieldName: NUMBER_HOUSEHOLD_FIELD.fieldApiName, type: 'text', resizable: false }
    ];

    numberKidsColumns = [
        { label: '# of Children', fieldName: NUMBER_KIDS_FIELD.fieldApiName, type: 'text', resizable: false }
    ];

    laundryDetergentColumns = this.buildItemColumns('Laundry Detergent');
    paperTowelColumns = this.buildItemColumns('Paper Towel');
    toiletPaperColumns = this.buildItemColumns('Toilet Paper');

    caresCardBalanceColumns = [
        { label: 'Cares Account Balance', fieldName: CARES_BALANCE_FIELD.fieldApiName, type: 'number', editable: true, resizable: false }
    ];

    @wire(getRecord, { recordId: '$activeContactId', fields: [CONTACT_NAME_FIELD, CLIENTID_FIELD] })
    wiredContact({ error, data }) {
        if (data) {
            this.activeContactName = getFieldValue(data, CONTACT_NAME_FIELD);
            this.activeClientId = getFieldValue(data, CLIENTID_FIELD);
        } else if (error && this.activeContactId) {
            this.showToast('Contact Error', this.reduceError(error), 'error');
        }
    }

    @wire(getLastAssistanceDate, { contactId: '$activeContactId', recordTypeId: CARES_CENTER_RECORD_TYPE_ID })
    wiredCaresCenterDate(result) {
        this.caresCenterDateResult = result;

        if (result.data) {
            this.caresCenterData = result.data.map(row => ({
                ...row,
                eligibleClass: this.getEligibilityClass(row.Eligible_for_Food_Pantry_Shopping__c)
            }));
        } else if (result.error && this.activeContactId) {
            this.showToast('Cares Visit Error', this.reduceError(result.error), 'error');
        }
    }

    @wire(getNoShowStatus, { contactId: '$activeContactId', recordTypeId: CARES_CENTER_RECORD_TYPE_ID })
    caresNoShowStatusResult;

    @wire(getTotalNumberInHousehold, { contactId: '$activeContactId' })
    totalNumberInHouseholdResult;

    @wire(getNumberKidsForSummerFood, { contactId: '$activeContactId' })
    numberKidsResult;

    @wire(getLaundryDetergent, { contactId: '$activeContactId' })
    wiredLaundryDetergent({ error, data }) {
        if (data) {
            this.laundryDetergentData = this.formatItemRows(data, 'Laundry Detergent', 'placeholder-laundry-detergent');
        } else if (error && this.activeContactId) {
            this.showToast('Laundry Detergent Error', this.reduceError(error), 'error');
        }
    }

    @wire(getPaperTowel, { contactId: '$activeContactId' })
    wiredPaperTowel({ error, data }) {
        if (data) {
            this.paperTowelData = this.formatItemRows(data, 'Paper Towel', 'placeholder-paper-towel');
        } else if (error && this.activeContactId) {
            this.showToast('Paper Towel Error', this.reduceError(error), 'error');
        }
    }

    @wire(getToiletPaper, { contactId: '$activeContactId' })
    wiredToiletPaper({ error, data }) {
        if (data) {
            this.toiletPaperData = this.formatItemRows(data, 'Toilet Paper', 'placeholder-toilet-paper');
        } else if (error && this.activeContactId) {
            this.showToast('Toilet Paper Error', this.reduceError(error), 'error');
        }
    }

    @wire(getCaresCardBalance, { contactId: '$activeContactId' })
    caresCardBalanceResult;

    @wire(getScannedContacts, { eventType: CARES_CENTER_EVENT_TYPE })
    wiredScannedContactsCaresResult;

    get caresScannedContacts() {
        return this.wiredScannedContactsCaresResult?.data || [];
    }

    get formattedTotalAmount() {
        return this.totalAmount.toFixed(2);
    }

    get selectedRows() {
        return Object.values(this.selectedRowsByItem).flat();
    }

    buildItemColumns(label) {
        return [
            { label, fieldName: ITEM_DATE_FIELD.fieldApiName, type: 'text', resizable: false },
            {
                label: 'Eligible',
                fieldName: ITEM_ELIGIBLE_FIELD.fieldApiName,
                type: 'text',
                resizable: false,
                cellAttributes: { class: { fieldName: 'eligibleClass' } }
            }
        ];
    }

    formatItemRows(data, itemName, placeholderPrefix) {
        if (!data || data.length === 0) {
            return [{
                Id: `${placeholderPrefix}-${this.activeContactId || 'none'}`,
                Name: itemName,
                Date_Item_was_Received__c: null,
                Eligible_for_Item__c: null,
                eligibleClass: ''
            }];
        }

        return data.map(row => ({
            ...row,
            eligibleClass: this.getEligibilityClass(row.Eligible_for_Item__c)
        }));
    }

    getEligibilityClass(value) {
        if (value === 'No') {
            return 'slds-text-color_error slds-text-title_bold';
        }

        if (value === 'Yes') {
            return 'slds-text-color_success slds-text-title_bold';
        }

        return '';
    }

    resetTransactionState() {
        this.totalAmount = 0;
        this.selectedRowsByItem = {};
        this.caresCenterCheckedOut = false;
        this.isCompleteTransactionButtonDisabled = false;
        this.isCaresPanelLocked = false;
        this.saveDraftValues = [];
    }

    handleRowSelection(event) {
        const itemName = event.currentTarget.dataset.item;
        this.selectedRowsByItem = {
            ...this.selectedRowsByItem,
            [itemName]: event.detail.selectedRows
        };
    }

    async handleCaresCenterCheckOut() {
        const checkoutContactId = this.activeContactId;

        this.isCompleteTransactionButtonDisabled = true;
        this.isCaresPanelLocked = true;

        try {
            await createCaresCenterAssistance({
                contactId: checkoutContactId,
                recordTypeId: CARES_CENTER_RECORD_TYPE_ID,
                amountSpent: this.totalAmount
            });

            for (const row of this.selectedRows) {
                if (row.Name === 'Laundry Detergent' || row.Name === 'Paper Towel' || row.Name === 'Toilet Paper') {
                    await createCaresCenterItem({
                        contactId: checkoutContactId,
                        itemName: row.Name
                    });
                }
            }

            await updateCaresCardBalance({
                contactId: checkoutContactId,
                amount: this.totalAmount
            });

            await this.deleteScannedContactForContact(checkoutContactId, false);
            await this.refreshCaresData();

            this.caresCenterCheckedOut = true;
            this.showToast('Transaction Completed', 'Cares Center transaction completed successfully.', 'success');
        } catch (error) {
            this.isCompleteTransactionButtonDisabled = false;
            this.showToast('Cares Center Error', `Cares Center transaction could not be completed: ${this.reduceError(error)}`, 'error');
        } finally {
            this.isCaresPanelLocked = false;
        }
    }

    handleKeyUpAdd(event) {
        if (event.keyCode === 13) {
            this.handleAddToTotal(event);
            event.target.blur();
        }
    }

    handleKeyUpSubtract(event) {
        if (event.keyCode === 13) {
            this.handleSubtractFromTotal(event);
            event.target.blur();
        }
    }

    handleAddToTotal(event) {
        const value = parseFloat(event.target.value);

        if (!isNaN(value)) {
            this.totalAmount += value;
        }

        event.target.value = '';
    }

    handleSubtractFromTotal(event) {
        const value = parseFloat(event.target.value);

        if (!isNaN(value)) {
            this.totalAmount -= value;
        }

        event.target.value = '';
    }

    handleResetTotalAmount() {
        this.totalAmount = 0;
    }

    async handleRefreshCares() {
        await this.refreshCaresData();
        this.showToast('Refreshed', 'Cares Center data refreshed.', 'success');
    }

    async handleSwitchContactCares(event) {
        const contactId = event.currentTarget.dataset.id;
        const contact = this.caresScannedContacts.find(item => item.Contact_ID__c === contactId);

        if (!contact) {
            return;
        }

        this.activeContactId = contact.Contact_ID__c;
        this.activeContactName = contact.Contact_Name__c;
        this.resetTransactionState();

        this.dispatchEvent(new CustomEvent('contactchange', {
            detail: {
                contactId: this.activeContactId,
                contactName: this.activeContactName
            }
        }));
    }

    async handleCaresCenterDeleteScan() {
        try {
            await this.deleteCurrentScannedContact(true);
            await this.refreshCaresData();
            this.showToast('Removed', 'Contact removed from Cares Center list.', 'success');
        } catch (error) {
            this.showToast('Delete Failed', `Could not remove contact from the scanned list: ${this.reduceError(error)}`, 'error');
        }
    }

    async deleteCurrentScannedContact(showErrorIfMissing) {
        await this.deleteScannedContactForContact(this.activeContactId, showErrorIfMissing);
    }

    async deleteScannedContactForContact(contactId, showErrorIfMissing) {
        if (!contactId) {
            if (showErrorIfMissing) {
                throw new Error('No Cares Center contact is currently selected.');
            }
            return;
        }

        await deleteScannedContact({
            contactId,
            eventType: CARES_CENTER_EVENT_TYPE
        });
    }

    async handleSave(event) {
        this.saveDraftValues = event.detail.draftValues;
        const recordInputs = this.saveDraftValues.map(draft => ({ fields: { ...draft } }));

        try {
            await Promise.all(recordInputs.map(recordInput => updateRecord(recordInput)));
            this.saveDraftValues = [];
            await this.refreshCaresData();
            this.showToast('Success', 'Records updated successfully.', 'success');
        } catch (error) {
            this.showToast('Update Failed', this.reduceError(error), 'error');
        } finally {
            this.saveDraftValues = [];
        }
    }

    async refreshCaresData() {
        const refreshes = [];

        if (this.caresCenterDateResult) refreshes.push(refreshApex(this.caresCenterDateResult));
        if (this.caresNoShowStatusResult) refreshes.push(refreshApex(this.caresNoShowStatusResult));
        if (this.totalNumberInHouseholdResult) refreshes.push(refreshApex(this.totalNumberInHouseholdResult));
        if (this.numberKidsResult) refreshes.push(refreshApex(this.numberKidsResult));
        if (this.caresCardBalanceResult) refreshes.push(refreshApex(this.caresCardBalanceResult));
        if (this.wiredScannedContactsCaresResult) refreshes.push(refreshApex(this.wiredScannedContactsCaresResult));

        await Promise.all(refreshes);
    }

    @api
    async refreshScannedContactList() {
        try {
            if (this.wiredScannedContactsCaresResult) {
                await refreshApex(this.wiredScannedContactsCaresResult);
            }
        } catch (error) {
            console.error('Error refreshing Cares scanned contact list:', error);
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    reduceError(error) {
        if (Array.isArray(error?.body)) {
            return error.body.map(e => e.message).join(', ');
        }

        return error?.body?.message || error?.message || JSON.stringify(error);
    }
}