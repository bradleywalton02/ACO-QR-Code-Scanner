import { LightningElement, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Contact.Name';
import CLIENTID_FIELD from '@salesforce/schema/Contact.c4g_Client_ID__c';
import DATE_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Date_of_Assistance__c';
import KIDS_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.of_Children_Receiving_Toys__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getBarcodeScanner } from 'lightning/mobileCapabilities';
import createAssistance from '@salesforce/apex/createAssistance.createAssistance';
import updateNorthPoleAssistance from '@salesforce/apex/createAssistance.updateNorthPoleAssistance';
import checkDate from '@salesforce/apex/createAssistance.checkDate';
import getNumberKids from '@salesforce/apex/createAssistance.getNumberKids';

const COLUMNS1 = [
    {label: 'Last Date of Food Pantry Assistance', fieldName: DATE_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS2 = [
    {label: 'Last Date of Holiday Food Assistance', fieldName: DATE_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS3 = [
    {label: '# Kids For North Pole', fieldName: KIDS_FIELD.fieldApiName, type: 'text'}
];

export default class BarcodeScanner extends LightningElement {
    myScanner;
    scanButtonDisabled = false;
    scannedBarcode = '';
    foodPantryAssistanceCreated = false;
    holidayFoodAssistanceCreated = false;
    northPoleAssistanceUpdated = false;

    columns1 = COLUMNS1;
    @wire(checkDate, {contactId : '$scannedBarcode', recordTypeId : '01239000000EG3lAAG'})
    dateFP;

    columns2 = COLUMNS2;
    @wire(checkDate, {contactId : '$scannedBarcode', recordTypeId : '0124z000000Q9xaAAC'})
    dateHoliday;

    columns3 = COLUMNS3;
    @wire(getNumberKids, {contactId : '$scannedBarcode', recordTypeId : '012390000006CFBAA2'})
    numberKids;

    @wire(getRecord, {recordId : '$scannedBarcode', fields: [NAME_FIELD, CLIENTID_FIELD]})
    contact;

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
        this.northPoleAssistanceUpdated = false;

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
        createAssistance({contactId : this.scannedBarcode, recordTypeId: '01239000000EG3lAAG', typeOfAssistance: 'Food Pantry'});
        this.foodPantryAssistanceCreated = true
    }
    handleCreateHolidayFoodAssistance() {
        createAssistance({contactId : this.scannedBarcode, recordTypeId: '0124z000000Q9xaAAC', typeOfAssistance: 'Holiday Food'});
        this.holidayFoodAssistanceCreated = true
    }
    handleNorthPoleCheckIn() {
        updateNorthPoleAssistance({contactId : this.scannedBarcode});
        this.northPoleAssistanceUpdated = true
    }
}