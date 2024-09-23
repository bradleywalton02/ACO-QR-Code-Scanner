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
import KIDS_SUMMER_FIELD from '@salesforce/schema/Case.Children_in_Your_Home_0_17__c';
import NUMBER_HOUSEHOLD_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Total_Number_in_Household__c';
import FOOD_ELIGIBLE_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Eligible_for_Food_Pantry_Shopping__c';
import ITEM_DATE_FIELD from '@salesforce/schema/Cares_Center_Item__c.Date_Item_was_Received__c';
import ITEM_ELIGIBLE_FIELD from '@salesforce/schema/Cares_Center_Item__c.Eligible_for_Item__c';
import CARES_BALANCE_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.ACO_Cares_Card__c';
import SPECIAL_EVENT_BALANCE_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Special_Event_Balance__c';
import NO_SHOW_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.No_Show_Formula_for_Scanner__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getBarcodeScanner } from 'lightning/mobileCapabilities';
import createFoodAssistance from '@salesforce/apex/createAssistance.createFoodAssistance';
import createCaresCenterAssistance from '@salesforce/apex/createAssistance.createCaresCenterAssistance';
import createCaresCenterItem from '@salesforce/apex/createAssistance.createCaresCenterItem';
import updateNorthPoleAssistance from '@salesforce/apex/createAssistance.updateNorthPoleAssistance';
import updateSchoolSuppliesAssistance from '@salesforce/apex/createAssistance.updateSchoolSuppliesAssistance';
import updateSeminarAssistance from '@salesforce/apex/createAssistance.updateSeminarAssistance';
import checkDate from '@salesforce/apex/createAssistance.checkDate';
import getNumberKids from '@salesforce/apex/createAssistance.getNumberKids';
import getTotalNumberInHousehold from '@salesforce/apex/createAssistance.getTotalNumberInHousehold';
import getChildInfo from '@salesforce/apex/createAssistance.getChildInfo';
import getNumberBackpacks from '@salesforce/apex/createAssistance.getNumberBackpacks';
import getKidsForSummerFood from '@salesforce/apex/createAssistance.getKidsForSummerFood';
import getLaundryDetergent from '@salesforce/apex/createAssistance.getLaundryDetergent';
import getPaperTowel from '@salesforce/apex/createAssistance.getPaperTowel';
import getToiletPaper from '@salesforce/apex/createAssistance.getToiletPaper';
import getCaresCardBalance from '@salesforce/apex/createAssistance.getCaresCardBalance';
import updateCaresCardBalance from '@salesforce/apex/createAssistance.updateCaresCardBalance';
import getCaresCenterDates from '@salesforce/apex/createAssistance.getCaresCenterDates';
import getSpecialEventBalance from '@salesforce/apex/createAssistance.getSpecialEventBalance';
import updateSpecialEventBalance from '@salesforce/apex/createAssistance.updateSpecialEventBalance';
import getNoShowStatus from '@salesforce/apex/createAssistance.getNoShowStatus';

const COLUMNS1 = [
    {label: 'Last Date of Food Pantry Assistance', fieldName: DATE_FIELD.fieldApiName, type: 'text'},
    {label: 'Eligible', fieldName: FOOD_ELIGIBLE_FIELD.fieldApiName, type: 'text'}
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
    {label: 'Last School Supplies Application', fieldName: DATE_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS8 = [
    {label: '# Kids For School Supplies', fieldName: BACKPACKS_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS9 = [
    {label: 'School Supplies Balance', fieldName: SPECIAL_EVENT_BALANCE_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS10 = [
    {label: 'Cares Center Visits This Month', fieldName: DATE_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS11 = [
    {label: 'Laundry Detergent', fieldName: ITEM_DATE_FIELD.fieldApiName, type: 'text'},
    {label: 'Eligible', fieldName: ITEM_ELIGIBLE_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS12 = [
    {label: 'Paper Towel', fieldName: ITEM_DATE_FIELD.fieldApiName, type: 'text'},
    {label: 'Eligible', fieldName: ITEM_ELIGIBLE_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS13 = [
    {label: 'Toilet Paper', fieldName: ITEM_DATE_FIELD.fieldApiName, type: 'text'},
    {label: 'Eligible', fieldName: ITEM_ELIGIBLE_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS14 = [
    {label: 'Cares Account Balance', fieldName: CARES_BALANCE_FIELD.fieldApiName, type: 'number', editable: true}
];

const COLUMNS15 = [
    {label: 'Total # in Household', fieldName: NUMBER_HOUSEHOLD_FIELD.fieldApiName, type: 'text'}
];

const COLUMNS16 = [
    {label: 'No Show for Last Visit?', fieldName: NO_SHOW_FIELD.fieldApiName, type: 'text'}
];

export default class BarcodeScanner extends LightningElement {
    myScanner;
    scanButtonDisabled = false;
    scannedBarcode = '';
    foodPantryAssistanceCreated = false;
    holidayFoodAssistanceCreated = false;
    summerFoodAssistanceCreated = false;
    seminarAssistanceUpdated = false;
    northPoleAssistanceUpdated = false;
    schoolSuppliesAssistanceUpdated = false;
    caresCenterCheckedOut = false;
    currentMonth = new Date().getMonth() + 1;
    holidayActive = (this.currentMonth == 11 || this.currentMonth == 12);
    kidsSummerActive = (this.currentMonth == 6 || this.currentMonth == 7 || this.currentMonth == 8);
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
    @wire(checkDate, {contactId : '$scannedBarcode', recordTypeId : '012390000006CF1AAM'})
    dateSchoolSupplies;

    columns8 = COLUMNS8;
    @wire(getNumberBackpacks, {contactId : '$scannedBarcode', recordTypeId : '012390000006CF1AAM'})
    numberBackpacks;

    columns9 = COLUMNS9;
    @wire(getSpecialEventBalance, {contactId : '$scannedBarcode', recordTypeId : '012390000006CF1AAM'})
    schoolSuppliesBalance;

    columns10 = COLUMNS10;
    @wire(getCaresCenterDates, {contactId : '$scannedBarcode', recordTypeId : '012Nt000000plo5IAA'})
    dateCaresCenter;

    columns11 = COLUMNS11;
    @wire(getLaundryDetergent, {contactId : '$scannedBarcode'})
    laundryDetergent({error, data}) {
        if (data) {
            // Check if the data array is empty
            if (data.length == 0) {
                // If the data array is empty, assign a placeholder row
                this.laundryDetergentData = [{Name: 'Laundry Detergent'}];
            } else {
                // If data is available, assign it to the component property
                this.laundryDetergentData = data;
            }
        } else if (error) {
            console.error('Error fetching data:', error);
        }
    }

    columns12 = COLUMNS12;
    @wire(getPaperTowel, {contactId : '$scannedBarcode'})
    paperTowel({error, data}) {
        if (data) {
            // Check if the data array is empty
            if (data.length == 0) {
                // If the data array is empty, assign a placeholder row
                this.paperTowelData = [{Name: 'Paper Towel'}];
            } else {
                // If data is available, assign it to the component property
                this.paperTowelData = data;
            }
        } else if (error) {
            console.error('Error fetching data:', error);
        }
    }

    columns13 = COLUMNS13;
    @wire(getToiletPaper, {contactId : '$scannedBarcode'})
    toiletPaper({error, data}) {
        if (data) {
            // Check if the data array is empty
            if (data.length == 0) {
                // If the data array is empty, assign a placeholder row
                this.toiletPaperData = [{Name: 'Toilet Paper'}];
            } else {
                // If data is available, assign it to the component property
                this.toiletPaperData = data;
            }
        } else if (error) {
            console.error('Error fetching data:', error);
        }
    }

    columns14 = COLUMNS14;
    @wire(getCaresCardBalance, {contactId : '$scannedBarcode'})
    caresCardBalance;

    columns15 = COLUMNS15;
    @wire(getTotalNumberInHousehold, {contactId : '$scannedBarcode'})
    totalNumberInHousehold;

    columns16 = COLUMNS16;
    @wire(getNoShowStatus, {contactId : '$scannedBarcode', recordTypeId: '01239000000EG3lAAG'})
    noShowStatus;

    @wire(getRecord, {recordId : '$scannedBarcode', fields: [NAME_FIELD, CLIENTID_FIELD]})
    wiredContact({error, data}) {
        if (data) {
            this.contact = data;
            this.clientid = getFieldValue(data, CLIENTID_FIELD);
            this.name = getFieldValue(data, NAME_FIELD);
        } else if (error) {
            console.error('Error retrieving contact data: ', error);
        }
    }

    @track foodPantryVal = false;
    @track northPoleVal = false;
    @track schoolSuppliesVal = false;
    @track caresCenterVal = false;
    @track learningAcademyVal = false;
    @track isCreateFoodButtonDisabled = false;
    @track selectedRows = [];
    @track childInfo;
    @track caresCardBalance;
    @track totalAmount = 0;
    @track laundryDetergentData = [];
    @track paperTowelData = [];
    @track toiletPaperData = [];
    @track scannedContacts = [];
    @track contact;
    @track clientid;
    @track name;
 
    selectedItemValue;
    workshopType;
    poundsValue;
    workshopName;
    saveDraftValues = [];
    
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
        this.caresCenterCheckedOut = false;
        this.laundryDetergentData = [];
        this.paperTowelData = [];
        this.toiletPaperData = [];
        this.selectedRows = [];
        this.totalAmount = 0;

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
                    this.poundsValue = 0;
                    if (this.northPoleVal) {
                        updateNorthPoleAssistance({contactId : this.scannedBarcode});
                        this.northPoleAssistanceUpdated = true;
                    }
                    if (this.caresCenterVal) {
                        createCaresCenterAssistance({contactId : this.scannedBarcode, recordTypeId: '012Nt000000plo5IAA'});
                        setTimeout(() => {
                            this.scannedContacts.push({id: this.scannedBarcode, name: this.name});
                        }, 2000);
                    }
                    if (this.learningAcademyVal) {
                        updateSeminarAssistance({contactId : this.scannedBarcode, typeOfWorkshop: this.workshopType, workshopName: this.workshopName});
                        this.seminarAssistanceUpdated = true;
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

    async handleCreateFoodPantryAssistance() {
        this.isCreateFoodButtonDisabled = true; // Disable button when operation starts
        try {
            // Call the Apex method with the correct parameters
            let result = await createFoodAssistance({
                contactId: this.scannedBarcode,
                recordTypeId: '01239000000EG3lAAG',
                typeOfAssistance: 'Food Pantry',
                pounds: this.poundsValue
            });
            
            // Update the component state
            this.foodPantryAssistanceCreated = true;
    
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

    handleRowSelection(event) {
        const newlySelectedRows = event.detail.selectedRows;
        this.selectedRows = [...this.selectedRows, ...newlySelectedRows];
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

    handleCaresCenterCheckOut() {
        this.selectedRows.forEach(row => {
            if (row.Name == 'Laundry Detergent') {
                createCaresCenterItem({contactId : this.scannedBarcode, itemName: 'Laundry Detergent'});
            }

            else if (row.Name == 'Paper Towel') {
                createCaresCenterItem({contactId : this.scannedBarcode, itemName: 'Paper Towel'});
            }

            else if (row.Name == 'Toilet Paper') {
                createCaresCenterItem({contactId : this.scannedBarcode, itemName: 'Toilet Paper'});
            }
        });
        updateCaresCardBalance({contactId : this.scannedBarcode, amount: this.totalAmount})
            .then(res => {
                this.refresh();
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Updating Balance',
                        message: 'Cares Account balance could not be updated.',
                        variant: 'error'
                    })
                );
            });
        this.scannedContacts = this.scannedContacts.filter(contact => contact.id != this.scannedBarcode);
        this.caresCenterCheckedOut = true;
    }
    
    handleSwitchContact(event) {
        const contactId = event.currentTarget.dataset.id;
        const contact = this.scannedContacts.find(item => item.id == contactId);

        if (contact) {
            this.scannedBarcode = '';
            this.caresCenterCheckedOut = false;
            this.laundryDetergentData = [];
            this.paperTowelData = [];
            this.toiletPaperData = [];
            this.selectedRows = [];
            this.totalAmount = 0;
            setTimeout(() => {
                this.scannedBarcode = contact.id;
                this.name = contact.name;
            }, 100);
        }
    }

    handleKeyUpAdd(event) {
        if (event.keyCode == 13) { // 13 is the key code for Enter
            // Call the original blur handler
            this.handleAddToTotal(event);
            // Blur the input element to hide the keyboard
            event.target.blur();
        }
    }

    handleKeyUpSubtract(event) {
        if (event.keyCode == 13) { // 13 is the key code for Enter
            // Call the original blur handler
            this.handleSubtractFromTotal(event);
            // Blur the input element to hide the keyboard
            event.target.blur();
        }
    }

    handleAddToTotal(event) {
        if (!isNaN(parseFloat(event.target.value))) {
            this.totalAmount += parseFloat(event.target.value);
        }

        const inputField = this.template.querySelector('lightning-input[data-id="priceInputAdd"]');
        if (inputField) {
            inputField.value = ''; // Clear the value
        }
    }

    handleSubtractFromTotal(event) {
        if (!isNaN(parseFloat(event.target.value))) {
            this.totalAmount -= parseFloat(event.target.value);
        }

        const inputField = this.template.querySelector('lightning-input[data-id="priceInputSubtract"]');
        if (inputField) {
            inputField.value = ''; // Clear the value
        }
    }

    handleResetTotalAmount() {
        this.totalAmount = 0;
    }

    get formattedTotalAmount() {
        return this.totalAmount.toFixed(2);
    }

    handleWorkshopChange(event) {
        this.workshopType = event.detail.value;
    }

    handleWorkshopName(event) {
        this.workshopName = event.detail.value;
    }

    handleOnselect(event) {
        this.selectedItemValue = event.detail.value;
 
        if (this.selectedItemValue == 'foodPantry') {
            this.foodPantryVal = true;
        } else {
            this.foodPantryVal = false;
        }
       
        if (this.selectedItemValue == 'northPole') {
            this.northPoleVal = true;
        } else {
            this.northPoleVal = false;
        }
        
        if (this.selectedItemValue == 'schoolSupplies') {
            this.schoolSuppliesVal = true;
        } else {
            this.schoolSuppliesVal = false;
        }

        if (this.selectedItemValue == 'caresCenter') {
            this.caresCenterVal = true;
        } else {
            this.caresCenterVal = false;
        }

        if (this.selectedItemValue == 'learningAcademy') {
            this.learningAcademyVal = true;
        } else {
            this.learningAcademyVal = false;
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
        await refreshApex(this.childInfo);
        await refreshApex(this.caresCardBalance);
        await refreshApex(this.schoolSuppliesBalance);
    }
}