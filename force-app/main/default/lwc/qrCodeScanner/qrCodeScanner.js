import { LightningElement, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import CONTACT_NAME_FIELD from '@salesforce/schema/Contact.Name';
import CLIENTID_FIELD from '@salesforce/schema/Contact.c4g_Client_ID__c';
import ASSISTANCE_DATE_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Date_of_Assistance__c';
import NUMBER_KIDS_NP_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.of_Children_Receiving_Toys__c';
import CHILD_NAME_NP_FIELD from '@salesforce/schema/Holiday__c.Child_Name__c';
import CHILD_AGE_NP_FIELD from '@salesforce/schema/Holiday__c.Child_Age__c';
import CHILD_GENDER_NP_FIELD from '@salesforce/schema/Holiday__c.Gender__c';
import CHILD_NAME_SS_FIELD from '@salesforce/schema/SS_Child__C.Child_Name__c';
import CHILD_AGE_SS_FIELD from '@salesforce/schema/SS_Child__C.Child_Age__c';
import CHILD_GENDER_SS_FIELD from '@salesforce/schema/SS_Child__C.Child_Gender__c';
import CHILD_GRADE_SS_FIELD from '@salesforce/schema/SS_Child__C.Child_Grade__c';
import NUMBER_KIDS_SS_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.of_Children_Receiving_School_Supplies__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getBarcodeScanner } from 'lightning/mobileCapabilities';
import createCaresCenterAssistance from '@salesforce/apex/createAssistance.createCaresCenterAssistance';
import updateNorthPoleAssistance from '@salesforce/apex/createAssistance.updateNorthPoleAssistance';
import updateSchoolSuppliesAssistance from '@salesforce/apex/createAssistance.updateSchoolSuppliesAssistance';
import updateSeminarAssistance from '@salesforce/apex/createAssistance.updateSeminarAssistance';
import updateSpecialEventBalance from '@salesforce/apex/createAssistance.updateSpecialEventBalance';
import getLastAssistanceDate from '@salesforce/apex/createAssistance.getLastAssistanceDate';
import getNumberKidsForNorthPole from '@salesforce/apex/createAssistance.getNumberKidsForNorthPole';
import getNorthPoleChildInfo from '@salesforce/apex/createAssistance.getNorthPoleChildInfo';
import getSchoolSuppliesChildInfo from '@salesforce/apex/createAssistance.getSchoolSuppliesChildInfo';
import getNumberBackpacks from '@salesforce/apex/createAssistance.getNumberBackpacks';
import isContactSuspended from '@salesforce/apex/createAssistance.isContactSuspended';
import createScannedContact from '@salesforce/apex/createAssistance.createScannedContact';

const CARES_CENTER_RECORD_TYPE_ID = '012Nt000000plo5IAA';
const CARES_CENTER_EVENT_TYPE = 'Cares Center';
const FOOD_PANTRY_EVENT_TYPE = 'Food Pantry';

export default class BarcodeScanner extends LightningElement {
    myScanner;

    scannedBarcode = '';
    contact;
    contactName;
    clientid;
    isSuspended = false;

    seminarAssistanceUpdated = false;
    northPoleAssistanceUpdated = false;
    schoolSuppliesAssistanceUpdated = false;

    scanButtonDisabled = false;

    currentMonth = new Date().getMonth() + 1;
    currentYear = new Date().getFullYear();
    holidayActive = this.currentMonth == 11 || this.currentMonth == 12;
    kidsSummerActive = this.currentMonth == 6 || this.currentMonth == 7 || this.currentMonth == 8;
    nameOfCampaign = 'North Pole ' + this.currentYear + ' Sign Ups';
    nameOfCampaignSS = 'School Supplies ' + this.currentYear + ' Sign Ups';

    foodPantryVal = false;
    northPoleVal = false;
    schoolSuppliesVal = false;
    caresCenterVal = false;
    learningAcademyVal = false;

    totalAmount = 0;

    selectedItemValue;
    seminarType;
    seminarName;

    isProcessingScan = false;

    numberKidsNorthPoleColumns = [
        { label: '# Kids For North Pole', fieldName: NUMBER_KIDS_NP_FIELD.fieldApiName, type: 'text', resizable: false }
    ];
    @wire(getNumberKidsForNorthPole, { contactId: '$northPoleContactId', recordTypeId: '012390000006CFBAA2' })
    numberKidsNorthPoleResult;

    northPoleChildInfoColumns = [
        { label: 'Name of Child', fieldName: CHILD_NAME_NP_FIELD.fieldApiName, type: 'text', resizable: false },
        { label: 'Age', fieldName: CHILD_AGE_NP_FIELD.fieldApiName, type: 'text', resizable: false },
        { label: 'Gender', fieldName: CHILD_GENDER_NP_FIELD.fieldApiName, type: 'text', resizable: false }
    ];
    @wire(getNorthPoleChildInfo, { contactId: '$northPoleContactId', campaignName: '$nameOfCampaign' })
    northPoleChildInfoResult;

    schoolSuppliesDateColumns = [
        { label: 'Last School Supplies Application', fieldName: ASSISTANCE_DATE_FIELD.fieldApiName, type: 'text', resizable: false }
    ];
    @wire(getLastAssistanceDate, { contactId: '$schoolSuppliesContactId', recordTypeId: '012390000006CF1AAM' })
    schoolSuppliesDateResult;

    numberKidsSchoolSuppliesColumns = [
        { label: '# Kids For School Supplies', fieldName: NUMBER_KIDS_SS_FIELD.fieldApiName, type: 'text', resizable: false }
    ];
    @wire(getNumberBackpacks, { contactId: '$schoolSuppliesContactId', recordTypeId: '012390000006CF1AAM' })
    numberKidsSchoolSuppliesResult;

    schoolSuppliesChildInfoColumns = [
        { label: 'Name of Child', fieldName: CHILD_NAME_SS_FIELD.fieldApiName, type: 'text', resizable: false },
        { label: 'Age', fieldName: CHILD_AGE_SS_FIELD.fieldApiName, type: 'text', resizable: false },
        { label: 'Grade', fieldName: CHILD_GRADE_SS_FIELD.fieldApiName, type: 'text', resizable: false },
        { label: 'Gender', fieldName: CHILD_GENDER_SS_FIELD.fieldApiName, type: 'text', resizable: false }
    ];
    @wire(getSchoolSuppliesChildInfo, { contactId: '$schoolSuppliesContactId', campaignName: '$nameOfCampaignSS' })
    schoolSuppliesChildInfoResult;

    @wire(getRecord, { recordId: '$scannedBarcode', fields: [CONTACT_NAME_FIELD, CLIENTID_FIELD] })
    wiredContact({ error, data }) {
        if (data) {
            this.contact = data;
            this.clientid = getFieldValue(data, CLIENTID_FIELD);
            this.contactName = getFieldValue(data, CONTACT_NAME_FIELD);
        } else if (error && this.scannedBarcode) {
            console.error('Error retrieving contact data: ', error);
        }
    }

    get northPoleContactId() {
        return this.northPoleVal ? this.scannedBarcode : null;
    }

    get schoolSuppliesContactId() {
        return this.schoolSuppliesVal ? this.scannedBarcode : null;
    }

    connectedCallback() {
        this.myScanner = getBarcodeScanner();
        if (this.myScanner == null || !this.myScanner.isAvailable()) {
            this.scanButtonDisabled = true;
        }
        this.scannedBarcode = null;
    }

    async handleBeginScanClick(event) {
        if (this.isProcessingScan) {
            return;
        }

        this.resetScanState();

        if (!this.myScanner || !this.myScanner.isAvailable()) {
            this.showToast(
                'QR Code Scanner Is Not Available',
                'Try again from the Salesforce app on a mobile device.',
                'error'
            );
            return;
        }

        this.isProcessingScan = true;

        try {
            const result = await this.myScanner.beginCapture({
                barcodeTypes: [this.myScanner.barcodeTypes.QR],
                instructionText: 'Scan a QR Code',
                successText: 'Scanning complete.'
            });

            this.scannedBarcode = result.value;
            await this.handleSuccessfulScan();

            this.showToast('Successful Scan', 'QR Code scanned successfully.', 'success');
        } catch (error) {
            this.handleScanError(error);
        } finally {
            this.isProcessingScan = false;

            try {
                this.myScanner.endCapture();
            } catch (error) {
                console.error('Error ending scanner capture:', error);
            }
        }
    }

    resetScanState() {
        this.scannedBarcode = '';
        this.northPoleAssistanceUpdated = false;
        this.schoolSuppliesAssistanceUpdated = false;
        this.seminarAssistanceUpdated = false;
        this.isSuspended = false;
        this.locationSuspended = '';
    }

    async handleSuccessfulScan() {
        const actions = [];

        if (this.northPoleVal) {
            actions.push(this.checkInNorthPole());
        }

        if (this.schoolSuppliesVal) {
            actions.push(this.checkInSchoolSupplies());
        }

        if (this.caresCenterVal) {
            this.locationSuspended = CARES_CENTER_EVENT_TYPE;
            actions.push(this.startCaresCenterVisit());
        }

        if (this.foodPantryVal) {
            this.locationSuspended = FOOD_PANTRY_EVENT_TYPE;
            actions.push(this.startFoodPantryVisit());
        }

        if (this.learningAcademyVal) {
            actions.push(this.checkInLearningAcademy());
        }

        await Promise.all(actions);
        await this.checkSuspensionStatus();
    }

    async checkInNorthPole() {
        await updateNorthPoleAssistance({ contactId: this.scannedBarcode });
        this.northPoleAssistanceUpdated = true;
    }

    async checkInSchoolSupplies() {
        await updateSchoolSuppliesAssistance({ contactId: this.scannedBarcode });
        this.schoolSuppliesAssistanceUpdated = true;
    }

    async startCaresCenterVisit() {
        await createScannedContact({
            contactId: this.scannedBarcode,
            eventType: CARES_CENTER_EVENT_TYPE
        });

        await createCaresCenterAssistance({
            contactId: this.scannedBarcode,
            recordTypeId: CARES_CENTER_RECORD_TYPE_ID,
            amountSpent: 0
        });

        await this.refreshCaresPanelScannedContacts();
    }

    async startFoodPantryVisit() {
        await createScannedContact({
            contactId: this.scannedBarcode,
            eventType: FOOD_PANTRY_EVENT_TYPE
        });

        await this.refreshFoodPantryPanelScannedContacts();
    }

    async checkInLearningAcademy() {
        await updateSeminarAssistance({
            contactId: this.scannedBarcode,
            typeOfSeminar: this.seminarType,
            seminarName: this.seminarName
        });
        this.seminarAssistanceUpdated = true;
    }

    async checkSuspensionStatus() {
        if (!this.scannedBarcode || !this.locationSuspended) {
            this.isSuspended = false;
            return;
        }

        try {
            this.isSuspended = await isContactSuspended({
                contactId: this.scannedBarcode,
                location: this.locationSuspended
            });
        } catch (error) {
            this.isSuspended = false;
            console.error('Error checking suspension:', error);
        }
    }

    async refreshCaresPanelScannedContacts() {
        await Promise.resolve();
        const caresPanel = this.template.querySelector('c-cares-center-panel');
        if (caresPanel) {
            await caresPanel.refreshScannedContactList();
        }
    }

    async refreshFoodPantryPanelScannedContacts() {
        await Promise.resolve();
        const foodPanel = this.template.querySelector('c-food-pantry-panel');
        if (foodPanel) {
            await foodPanel.refreshScannedContactList();
        }
    }

    handleScanError(error) {
        console.error(error);

        if (error?.code == 'userDismissedScanner') {
            this.showToast(
                'Scanning Cancelled',
                'You cancelled the scanning session.',
                'info',
                'sticky'
            );
            return;
        }

        this.showToast(
            'QR Code Scanner Error',
            `There was a problem scanning the QR code: ${this.reduceError(error)}`,
            'error',
            'sticky'
        );
    }

    handleSchoolSuppliesUpdate() {
        updateSchoolSuppliesAssistance({ contactId: this.scannedBarcode });
        updateSpecialEventBalance({ contactId: this.scannedBarcode, recordTypeId: '012390000006CF1AAM', amount: this.totalAmount })
            .then(() => {
                this.refresh();
            })
            .catch(() => {
                this.showToast('Error Updating Balance', 'School Supplies balance could not be updated.', 'error');
            });
        this.schoolSuppliesAssistanceUpdated = true;
    }

    handleSeminarChange(event) {
        this.seminarType = event.detail.value;
    }

    handleSeminarName(event) {
        this.seminarName = event.detail.value;
    }

    handleOnselect(event) {
        this.selectedItemValue = event.detail.value;

        this.foodPantryVal = this.selectedItemValue == 'foodPantry';
        this.northPoleVal = this.selectedItemValue == 'northPole';
        this.schoolSuppliesVal = this.selectedItemValue == 'schoolSupplies';
        this.caresCenterVal = this.selectedItemValue == 'caresCenter';
        this.learningAcademyVal = this.selectedItemValue == 'learningAcademy';

        this.scannedBarcode = null;
        this.contactName = null;
        this.clientid = null;
        this.isSuspended = false;
    }

    async refresh() {
        // Placeholder retained for older handlers such as School Supplies.
    }

    async handleCaresContactChange(event) {
        this.scannedBarcode = event.detail.contactId;
        this.contactName = event.detail.contactName;
        this.locationSuspended = CARES_CENTER_EVENT_TYPE;
        await this.checkSuspensionStatus();
    }

    async handleFoodPantryContactChange(event) {
        this.scannedBarcode = event.detail.contactId;
        this.contactName = event.detail.contactName;
        this.locationSuspended = FOOD_PANTRY_EVENT_TYPE;
        await this.checkSuspensionStatus();
    }

    showToast(title, message, variant = 'info', mode = 'dismissable') {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant,
                mode
            })
        );
    }

    reduceError(error) {
        if (!error) {
            return 'Unknown error';
        }

        if (Array.isArray(error.body)) {
            return error.body.map(e => e.message).join(', ');
        }

        if (typeof error.body?.message == 'string') {
            return error.body.message;
        }

        if (typeof error.message == 'string') {
            return error.message;
        }

        return JSON.stringify(error);
    }
}