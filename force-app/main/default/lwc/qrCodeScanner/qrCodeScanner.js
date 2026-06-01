import { LightningElement, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
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
import NUMBER_KIDS_FIELD from '@salesforce/schema/Case.Children_in_Your_Home_0_17__c';
import NUMBER_HOUSEHOLD_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Total_Number_in_Household__c';
import FOOD_ELIGIBLE_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Eligible_for_Food_Pantry_Shopping__c';
import NO_SHOW_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.No_Show_Formula_for_Scanner__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getBarcodeScanner } from 'lightning/mobileCapabilities';
import createFoodAssistance from '@salesforce/apex/createAssistance.createFoodAssistance';
import createCaresCenterAssistance from '@salesforce/apex/createAssistance.createCaresCenterAssistance';
import updateNorthPoleAssistance from '@salesforce/apex/createAssistance.updateNorthPoleAssistance';
import updateSchoolSuppliesAssistance from '@salesforce/apex/createAssistance.updateSchoolSuppliesAssistance';
import updateSeminarAssistance from '@salesforce/apex/createAssistance.updateSeminarAssistance';
import updateSpecialEventBalance from '@salesforce/apex/createAssistance.updateSpecialEventBalance';
import getLastAssistanceDate from '@salesforce/apex/createAssistance.getLastAssistanceDate';
import getNumberKidsForNorthPole from '@salesforce/apex/createAssistance.getNumberKidsForNorthPole';
import getTotalNumberInHousehold from '@salesforce/apex/createAssistance.getTotalNumberInHousehold';
import getNorthPoleChildInfo from '@salesforce/apex/createAssistance.getNorthPoleChildInfo';
import getSchoolSuppliesChildInfo from '@salesforce/apex/createAssistance.getSchoolSuppliesChildInfo';
import getNumberBackpacks from '@salesforce/apex/createAssistance.getNumberBackpacks';
import getNumberKidsForSummerFood from '@salesforce/apex/createAssistance.getNumberKidsForSummerFood';
import getNoShowStatus from '@salesforce/apex/createAssistance.getNoShowStatus';
import isContactSuspended from '@salesforce/apex/createAssistance.isContactSuspended';
import getScannedContacts from '@salesforce/apex/createAssistance.getScannedContacts';
import createScannedContact from '@salesforce/apex/createAssistance.createScannedContact';
import deleteScannedContact from '@salesforce/apex/createAssistance.deleteScannedContact';

export default class BarcodeScanner extends LightningElement {
    myScanner;

    scannedBarcode = '';
    contact;
    contactName;
    clientid;
    isSuspended = false;

    foodPantryAssistanceCreated = false;
    holidayFoodAssistanceCreated = false;
    summerFoodAssistanceCreated = false;
    seminarAssistanceUpdated = false;
    northPoleAssistanceUpdated = false;
    schoolSuppliesAssistanceUpdated = false;

    scanButtonDisabled = false;
    isCreateFoodButtonDisabled = false;

    currentMonth = new Date().getMonth() + 1;
    currentYear = new Date().getFullYear();
    holidayActive = (this.currentMonth == 11 || this.currentMonth == 12);
    kidsSummerActive = (this.currentMonth == 6 || this.currentMonth == 7 || this.currentMonth == 8);
    nameOfCampaign = 'North Pole ' + this.currentYear + ' Sign Ups'
    nameOfCampaignSS = 'School Supplies ' + this.currentYear + ' Sign Ups'

    foodPantryVal = false;
    northPoleVal = false;
    schoolSuppliesVal = false;
    caresCenterVal = false;
    learningAcademyVal = false;

    totalAmount = 0;
    poundsValue;

    selectedItemValue;
    seminarType;
    seminarName;

    isProcessingScan = false;

    foodPantryDateColumns = [
        {label: 'Last Date of Food Pantry Assistance', fieldName: ASSISTANCE_DATE_FIELD.fieldApiName, type: 'text', resizable: false},
        {label: 'Eligible', fieldName: FOOD_ELIGIBLE_FIELD.fieldApiName, type: 'text', resizable: false}
    ];
    @wire(getLastAssistanceDate, {contactId : '$foodContactId', recordTypeId : '01239000000EG3lAAG'})
    foodPantryDateResult;

    holidayFoodDateColumns = [
        {label: 'Last Date of Holiday Food Assistance', fieldName: ASSISTANCE_DATE_FIELD.fieldApiName, type: 'text', resizable: false}
    ];
    @wire(getLastAssistanceDate, {contactId : '$foodContactId', recordTypeId : '0124z000000Q9xaAAC'})
    holidayFoodDateResult;

    summerFoodDateColumns = [
        {label: 'Last Date of Summer Food Assistance', fieldName: ASSISTANCE_DATE_FIELD.fieldApiName, type: 'text', resizable: false}
    ];
    @wire(getLastAssistanceDate, {contactId : '$foodContactId', recordTypeId : '0124z000000JQpFAAW'})
    summerFoodDateResult;

    numberKidsSummerFoodColumns = [
        {label: '# Kids for Summer Food', fieldName: NUMBER_KIDS_FIELD.fieldApiName, type: 'text', resizable: false}
    ];
    @wire(getNumberKidsForSummerFood, {contactId : '$foodContactId'})
    numberKidsSummerFoodResult;

    numberKidsNorthPoleColumns = [
        {label: '# Kids For North Pole', fieldName: NUMBER_KIDS_NP_FIELD.fieldApiName, type: 'text', resizable: false}
    ];
    @wire(getNumberKidsForNorthPole, {contactId : '$northPoleContactId', recordTypeId : '012390000006CFBAA2'})
    numberKidsNorthPoleResult;
    
    northPoleChildInfoColumns = [
        {label: 'Name of Child', fieldName: CHILD_NAME_NP_FIELD.fieldApiName, type: 'text', resizable: false},
        {label: 'Age', fieldName: CHILD_AGE_NP_FIELD.fieldApiName, type: 'text', resizable: false},
        {label: 'Gender', fieldName: CHILD_GENDER_NP_FIELD.fieldApiName, type: 'text', resizable: false}
    ];
    @wire(getNorthPoleChildInfo, {contactId : '$northPoleContactId', campaignName : '$nameOfCampaign'})
    northPoleChildInfoResult;

    schoolSuppliesDateColumns = [
        {label: 'Last School Supplies Application', fieldName: ASSISTANCE_DATE_FIELD.fieldApiName, type: 'text', resizable: false}
    ];
    @wire(getLastAssistanceDate, {contactId : '$schoolSuppliesContactId', recordTypeId : '012390000006CF1AAM'})
    schoolSuppliesDateResult;

    numberKidsSchoolSuppliesColumns = [
        {label: '# Kids For School Supplies', fieldName: NUMBER_KIDS_SS_FIELD.fieldApiName, type: 'text', resizable: false}
    ];
    @wire(getNumberBackpacks, {contactId : '$schoolSuppliesContactId', recordTypeId : '012390000006CF1AAM'})
    numberKidsSchoolSuppliesResult;

    schoolSuppliesChildInfoColumns = [
        {label: 'Name of Child', fieldName: CHILD_NAME_SS_FIELD.fieldApiName, type: 'text', resizable: false},
        {label: 'Age', fieldName: CHILD_AGE_SS_FIELD.fieldApiName, type: 'text', resizable: false},
        {label: 'Grade', fieldName: CHILD_GRADE_SS_FIELD.fieldApiName, type: 'text', resizable: false},
        {label: 'Gender', fieldName: CHILD_GENDER_SS_FIELD.fieldApiName, type: 'text', resizable: false}
    ];
    @wire(getSchoolSuppliesChildInfo, {contactId : '$schoolSuppliesContactId', campaignName : '$nameOfCampaignSS'})
    schoolSuppliesChildInfoResult;

    householdSizeColumns = [
        {label: 'Total # in Household', fieldName: NUMBER_HOUSEHOLD_FIELD.fieldApiName, type: 'text', resizable: false}
    ];
    @wire(getTotalNumberInHousehold, {contactId : '$foodContactId'})
    totalNumberInHouseholdResult;

    foodNoShowStatusColumns = [
        {label: 'No Show for Last Visit?', fieldName: NO_SHOW_FIELD.fieldApiName, type: 'text', resizable: false}
    ];
    @wire(getNoShowStatus, {contactId : '$foodContactId', recordTypeId: '01239000000EG3lAAG'})
    foodNoShowStatusResult;

    @wire(getRecord, {recordId : '$scannedBarcode', fields: [CONTACT_NAME_FIELD, CLIENTID_FIELD]})
    wiredContact({error, data}) {
        if (data) {
            this.contact = data;
            this.clientid = getFieldValue(data, CLIENTID_FIELD);
            this.contactName = getFieldValue(data, CONTACT_NAME_FIELD);
        } else if (error) {
            console.error('Error retrieving contact data: ', error);
        }
    }

    @wire(getScannedContacts, {eventType: 'Food Pantry'})
    wiredScannedContactsFoodResult;

    get foodScannedContacts() {
        return this.wiredScannedContactsFoodResult?.data || [];
    }

    get foodContactId() {
        return this.foodPantryVal ? this.scannedBarcode : null;
    }

    get northPoleContactId() {
        return this.northPoleVal ? this.scannedBarcode : null;
    }

    get schoolSuppliesContactId() {
        return this.schoolSuppliesVal ? this.scannedBarcode : null;
    }

    // When component is initialized, detect whether to enable Scan button
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
                // endCapture can fail if capture never fully started.
                // This should not block the user from scanning again.
                console.error('Error ending scanner capture:', error);
            }
        }
    }

    resetScanState() {
        this.scannedBarcode = '';
        this.foodPantryAssistanceCreated = false;
        this.holidayFoodAssistanceCreated = false;
        this.summerFoodAssistanceCreated = false;
        this.northPoleAssistanceUpdated = false;
        this.schoolSuppliesAssistanceUpdated = false;
        this.poundsValue = '';
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
            this.locationSuspended = 'Cares Center';
            actions.push(this.startCaresCenterVisit());
        }

        if (this.foodPantryVal) {
            this.locationSuspended = 'Food Pantry';
            actions.push(this.addFoodPantryScannedContact());
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
            eventType: 'Cares Center'
        });
        // Creates today's Cares Center assistance if one does not exist yet.
        await createCaresCenterAssistance({
            contactId: this.scannedBarcode,
            recordTypeId: '012Nt000000plo5IAA',
            amountSpent: 0
        });

        await this.refreshCaresPanelScannedContacts();
    }

    async addFoodPantryScannedContact() {
        await createScannedContact({
            contactId: this.scannedBarcode,
            eventType: 'Food Pantry'
        });
        await refreshApex(this.wiredScannedContactsFoodResult);
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

    async handleCreateFoodPantryAssistance() {
        this.isCreateFoodButtonDisabled = true; // Disable button when operation starts
        try {
            // Validate the pounds value
            if (this.poundsValue <= 0) {
                // Show error toast if pounds is zero or negative
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Validation Error',
                        message: 'Pounds value cannot be zero or negative.',
                        variant: 'error'
                    })
                );
                return; // Exit if the validation fails
            }

            // Call the Apex method with the correct parameters
            let result = await createFoodAssistance({
                contactId: this.scannedBarcode,
                recordTypeId: '01239000000EG3lAAG',
                typeOfAssistance: 'Food Pantry',
                pounds: this.poundsValue
            });
            
            // Update the component state
            this.foodPantryAssistanceCreated = true;

            // Remove contact from contact list
            deleteScannedContact({contactId: this.scannedBarcode, eventType: 'Food Pantry'})
                .then(() => {
                    // Refresh the data after deletion
                    return refreshApex(this.wiredScannedContactsFoodResult);
                })
                .catch(error => console.error('Error deleting Scanned Contact:', error));
    
            // Show success toast
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Assistance Created',
                    message: `Assistance created successfully`,
                    variant: 'success'
                })
            );
        } catch (error) {
            // Show error toast
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Creating Assistance Failed',
                    message: `Failed to create assistance: ${error.body.message || JSON.stringify(error)}`,
                    variant: 'error'
                })
            );
        } finally {
            this.isCreateFoodButtonDisabled = false;
        }
    }

    handleCreateHolidayFoodAssistance() {
        createFoodAssistance({contactId : this.scannedBarcode, recordTypeId: '0124z000000Q9xaAAC', typeOfAssistance: 'Holiday Food'});
        this.holidayFoodAssistanceCreated = true;
    }

    handleCreateSummerFoodAssistance() {
        createFoodAssistance({contactId : this.scannedBarcode, recordTypeId: '0124z000000JQpFAAW', typeOfAssistance: 'Summer Food'});
        this.summerFoodAssistanceCreated = true;
    }

    handlePounds(event) {
        this.poundsValue = event.detail.value;
    }

    handleSchoolSuppliesUpdate() {
        updateSchoolSuppliesAssistance({contactId : this.scannedBarcode});
        updateSpecialEventBalance({contactId : this.scannedBarcode, recordTypeId : '012390000006CF1AAM', amount: this.totalAmount})
            .then(res => {
                this.refresh();
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Updating Balance',
                        message: 'School Supplies balance could not be updated.',
                        variant: 'error'
                    })
                );
            });
        this.schoolSuppliesAssistanceUpdated = true;
    }

    async handleFoodPantryDeleteScan() {
        await this.deleteScannedContactAndRefresh('Food Pantry');
    }

    async deleteScannedContactAndRefresh(eventType) {
        try {
            await deleteScannedContact({
                contactId: this.scannedBarcode,
                eventType
            });

            if (eventType == 'Food Pantry') {
                await refreshApex(this.wiredScannedContactsFoodResult);
            }
        } catch (error) {
            this.showToast(
                'Delete Failed',
                `Could not remove contact from the scanned list: ${this.reduceError(error)}`,
                'error'
            );
        }
    }

    async handleSwitchContactFood(event) {
        const contactId = event.currentTarget.dataset.id;
        const contact = this.foodScannedContacts.find(item => item.Contact_ID__c == contactId);
    
        if (contact) {
            this.scannedBarcode = contact.Contact_ID__c;
            this.contactName = contact.Contact_Name__c;
            this.foodPantryAssistanceCreated = false;
            this.summerFoodAssistanceCreated = false;
            this.poundsValue = '';
        }

        isContactSuspended({contactId: this.scannedBarcode, location: this.locationSuspended})
            .then(result => {
                this.isSuspended = result;
            })
            .catch(error => {
                console.error('Error checking suspension:', error);
            });
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

    handleRefreshFood() {
        refreshApex(this.wiredScannedContactsFoodResult);
    }

    async refresh() {
        // Placeholder refresh method retained for older handlers such as School Supplies.
        // Cares Center refreshes now live in caresCenterPanel.js.
    }

    async refreshCaresPanelScannedContacts() {
        await Promise.resolve();

        const caresPanel = this.template.querySelector('c-cares-center-panel');

        if (caresPanel) {
            await caresPanel.refreshScannedContactList();
        }
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
    async handleCaresContactChange(event) {
        this.scannedBarcode = event.detail.contactId;
        this.contactName = event.detail.contactName;
        this.locationSuspended = 'Cares Center';
        await this.checkSuspensionStatus();
    }

}