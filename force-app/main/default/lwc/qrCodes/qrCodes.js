import { LightningElement, wire, track } from 'lwc';
import { getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import NAME_FIELD from '@salesforce/schema/Contact.Name';
import CLIENTID_FIELD from '@salesforce/schema/Contact.c4g_Client_ID__c';
import DATE_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Date_of_Assistance__c';
import KIDS_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.of_Children_Receiving_Toys__c';
import CHILD_NAME from '@salesforce/schema/Holiday__c.Child_Name__c';
import ELIGIBLE_FIELD from '@salesforce/schema/Holiday__c.Eligible_for_Bike__c';
import BIKE_FIELD from '@salesforce/schema/Holiday__c.Date_Bike_was_Received__c';
import BACKPACKS_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.of_Backpack_with_School_Supplies_Given__c';
import GIRLS1_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.SS_Girls_1st_3rd_Grade__c';
import GIRLS4_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.SS_Girls_4th_6th_Grade__c';
import GIRLS7_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.SS_Girls_7th_8th_Grade__c';
import GIRLSK_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.SS_Girls_Pre_K_Kindergarten__c';
import BOYS1_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.SS_Boys_1st_3rd_Grade__c';
import BOYS4_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.SS_Boys_4th_6th_Grade__c';
import BOYS7_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.SS_Boys_7th_8th_Grade__c';
import BOYSK_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.SS_Boys_Pre_K_Kindergarten__c';
import KIDS_SUMMER_FIELD from '@salesforce/schema/Case.Children_in_Your_Home_0_17__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getBarcodeScanner } from 'lightning/mobileCapabilities';
import createAssistance from '@salesforce/apex/createAssistance.createAssistance';
import updateNorthPoleAssistance from '@salesforce/apex/createAssistance.updateNorthPoleAssistance';
import updateSchoolSuppliesAssistance from '@salesforce/apex/createAssistance.updateSchoolSuppliesAssistance';
import checkDate from '@salesforce/apex/createAssistance.checkDate';
import getNumberKids from '@salesforce/apex/createAssistance.getNumberKids';
import getChildInfo from '@salesforce/apex/createAssistance.getChildInfo';
import getNumberBackpacks from '@salesforce/apex/createAssistance.getNumberBackpacks';
import getKidsForSummerFood from '@salesforce/apex/createAssistance.getKidsForSummerFood';

const COLUMNS1 = [
    {label: 'Last Date of Food Pantry Assistance', fieldName: DATE_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS2 = [
    {label: 'Last Date of Holiday Food Assistance', fieldName: DATE_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS3 = [
    {label: 'Last Date of Summer Food Assistance', fieldName: DATE_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS4 = [
    {label: '# Kids for Summer Food', fieldName: KIDS_SUMMER_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS5 = [
    {label: '# Kids For North Pole', fieldName: KIDS_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS6 = [
    {label: 'Name of Child', fieldName: CHILD_NAME.fieldApiName, type: 'text'},
    {label: 'Eligible for Bike', fieldName: ELIGIBLE_FIELD.fieldApiName, type: 'text'},
    {label: 'Date Child Received Bike', fieldName: BIKE_FIELD.fieldApiName, type: 'text', editable: true}
];

const COLUMNS7 = [
    {label: '# Kids For School Supplies', fieldName: BACKPACKS_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS8 = [
    {label: '# Boys Pre-K/K', fieldName: BOYSK_FIELD.fieldApiName, type: 'text'},
    {label: '# Girls Pre-K/K', fieldName: GIRLSK_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS9 = [
    {label: '# Boys 1-3', fieldName: BOYS1_FIELD.fieldApiName, type: 'text'},
    {label: '# Girls 1-3', fieldName: GIRLS1_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS10 = [
    {label: '# Boys 4-6', fieldName: BOYS4_FIELD.fieldApiName, type: 'text'},
    {label: '# Girls 4-6', fieldName: GIRLS4_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS11 = [
    {label: '# Boys 7-8', fieldName: BOYS7_FIELD.fieldApiName, type: 'text'},
    {label: '# Girls 7-8', fieldName: GIRLS7_FIELD.fieldApiName, type: 'text'}
];

export default class BarcodeScanner extends LightningElement {
    myScanner;
    scanButtonDisabled = false;
    scannedBarcode = '';
    foodPantryAssistanceCreated = false;
    holidayFoodAssistanceCreated = false;
    summerFoodAssistanceCreated = false;
    northPoleAssistanceUpdated = false;
    schoolSuppliesAssistanceUpdated = false;
    currentYear = new Date().getFullYear();
    nameOfCampaign = 'North Pole ' + this.currentYear + ' Sign Ups'

    columns1 = COLUMNS1;
    @wire(checkDate, {contactId : '$scannedBarcode', recordTypeId : '01239000000EG3lAAG'})
    dateFP;

    columns2 = COLUMNS2;
    @wire(checkDate, {contactId : '$scannedBarcode', recordTypeId : '0124z000000Q9xaAAC'})
    dateHoliday;

    columns3 = COLUMNS3;
    @wire(checkDate, {contactId : '$scannedBarcode', recordTypeId : '0124z000000JQpFAAW'})
    dateSummer;

    columns4 = COLUMNS4;
    @wire(getKidsForSummerFood, {contactId : '$scannedBarcode'})
    numberKidsSummerFood;

    columns5 = COLUMNS5;
    @wire(getNumberKids, {contactId : '$scannedBarcode', recordTypeId : '012390000006CFBAA2'})
    numberKids;
    
    columns6 = COLUMNS6;
    @wire(getChildInfo, {contactId : '$scannedBarcode', campaignName : '$nameOfCampaign'})
    childInfo;

    columns7 = COLUMNS7;
    @wire(getNumberBackpacks, {contactId : '$scannedBarcode', recordTypeId : '012390000006CF1AAM'})
    numberBackpacks;

    columns8 = COLUMNS8;
    @wire(getNumberBackpacks, {contactId : '$scannedBarcode', recordTypeId : '012390000006CF1AAM'})
    prek;

    columns9 = COLUMNS9;
    @wire(getNumberBackpacks, {contactId : '$scannedBarcode', recordTypeId : '012390000006CF1AAM'})
    onethree;

    columns10 = COLUMNS10;
    @wire(getNumberBackpacks, {contactId : '$scannedBarcode', recordTypeId : '012390000006CF1AAM'})
    foursix;

    columns11 = COLUMNS11;
    @wire(getNumberBackpacks, {contactId : '$scannedBarcode', recordTypeId : '012390000006CF1AAM'})
    seveneight;

    @wire(getRecord, {recordId : '$scannedBarcode', fields: [NAME_FIELD, CLIENTID_FIELD]})
    contact;

    @track foodPantryVal = false;
    @track northPoleVal = false;
    @track schoolSuppliesVal = false;
    @track poundsVal = 0;
 
    selectedItemValue;
    poundsValue;
    saveDraftValues = [];

    get clientid() {
        return getFieldValue(this.contact.data, CLIENTID_FIELD)
    }

    get name() {
        return getFieldValue(this.contact.data, NAME_FIELD);
    }

    // When component is initialized, detect whether to enable Scan button
    connectedCallback() {
        this.myScanner = getBarcodeScanner();
        if (this.myScanner == null || !this.myScanner.isAvailable()) {
            this.scanButtonDisabled = true;
        }
    }

    handleBeginScanClick(event) {
        // Reset scannedBarcode to empty string before starting new scan
        this.scannedBarcode = '';
        this.foodPantryAssistanceCreated = false;
        this.holidayFoodAssistanceCreated = false;
        this.summerFoodAssistanceCreated = false;
        this.northPoleAssistanceUpdated = false;
        this.schoolSuppliesAssistanceUpdated = false;

        // Make sure BarcodeScanner is available before trying to use it
        // Note: We _also_ disable the Scan button if there's no BarcodeScanner
        if (this.myScanner != null && this.myScanner.isAvailable()) {
            const scanningOptions = {
                barcodeTypes: [this.myScanner.barcodeTypes.QR],
                instructionText: 'Scan a QR Code',
                successText: 'Scanning complete.'
            };
            this.myScanner
                .beginCapture(scanningOptions)
                .then((result) => {
                    console.log(result);
                    this.scannedBarcode = result.value;
                    if (this.northPoleVal == true) {
                        updateNorthPoleAssistance({contactId : this.scannedBarcode});
                        this.northPoleAssistanceUpdated = true;
                    }
                    if (this.schoolSuppliesVal == true) {
                        updateSchoolSuppliesAssistance({contactId : this.scannedBarcode});
                        this.schoolSuppliesAssistanceUpdated = true;
                    }
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Successful Scan',
                            message: 'QR Code scanned successfully.',
                            variant: 'success'
                        })
                    );
                })
                .catch((error) => {
                    // Handle cancellation and unexpected errors here
                    console.error(error);

                    if (error.code == 'userDismissedScanner') {
                        // User clicked Cancel
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Scanning Cancelled',
                                message:
                                    'You cancelled the scanning session.',
                                mode: 'sticky'
                            })
                        );
                    }
                    else { 
                        // Inform the user we ran into something unexpected
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'QR Code Scanner Error',
                                message:
                                    'There was a problem scanning the QR code: ' +
                                    error.message,
                                variant: 'error',
                                mode: 'sticky'
                            })
                        );
                    }
                })
                .finally(() => {
                    console.log('#finally');

                    // Clean up by ending capture,
                    // whether we completed successfully or had an error
                    this.myScanner.endCapture();
                });
        } else {
            // BarcodeScanner is not available
            // Not running on hardware with a camera, or some other context issue
            console.log(
                'Scan QR Code button should be disabled and unclickable.'
            );
            console.log('Somehow it got clicked: ');
            console.log(event);

            // Let user know they need to use a mobile phone with a camera
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'QR Code Scanner Is Not Available',
                    message:
                        'Try again from the Salesforce app on a mobile device.',
                    variant: 'error'
                })
            );
        }
    }
    handleCreateFoodPantryAssistance() {
        createAssistance({contactId : this.scannedBarcode, recordTypeId: '01239000000EG3lAAG', typeOfAssistance: 'Food Pantry', pounds: this.poundsValue});
        this.foodPantryAssistanceCreated = true;
    }
    handleCreateHolidayFoodAssistance() {
        createAssistance({contactId : this.scannedBarcode, recordTypeId: '0124z000000Q9xaAAC', typeOfAssistance: 'Holiday Food'});
        this.holidayFoodAssistanceCreated = true;
    }
    handleCreateSummerFoodAssistance() {
        createAssistance({contactId : this.scannedBarcode, recordTypeId: '0124z000000JQpFAAW', typeOfAssistance: 'Summer Food'});
        this.summerFoodAssistanceCreated = true;
    }
    handlePounds(event) {
        this.poundsValue = event.detail.value;
    }
    handleOnselect(event) {
        this.selectedItemValue = event.detail.value;
 
        if (this.selectedItemValue == 'foodPantry'){
            this.foodPantryVal = true;
        }else{
            this.foodPantryVal = false;
        }
       
        if (this.selectedItemValue == 'northPole'){
            this.northPoleVal = true;
        }else{
            this.northPoleVal = false;
        }
        
        if (this.selectedItemValue == 'schoolSupplies'){
            this.schoolSuppliesVal = true;
        }else{
            this.schoolSuppliesVal = false;
        } 
    }
    handleSave(event) {
        this.saveDraftValues = event.detail.draftValues;
        const recordInputs = this.saveDraftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });

        // Updating the records using the UiRecordAPi
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(res => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Records Updated Successfully!!',
                    variant: 'success'
                })
            );
            this.saveDraftValues = [];
            return this.refresh();
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'An Error Occured!!',
                    variant: 'error'
                })
            );
        }).finally(() => {
            this.saveDraftValues = [];
        });
    }

    // This function is used to refresh the table once data updated
    async refresh() {
        await refreshApex(this.contacts);
    }
}