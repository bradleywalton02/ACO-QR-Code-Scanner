import { LightningElement, wire } from 'lwc';
import { getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
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
import NUMBER_KIDS_SUMMER_FIELD from '@salesforce/schema/Case.Children_in_Your_Home_0_17__c';
import NUMBER_HOUSEHOLD_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Total_Number_in_Household__c';
import FOOD_ELIGIBLE_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Eligible_for_Food_Pantry_Shopping__c';
import ITEM_DATE_FIELD from '@salesforce/schema/Cares_Center_Item__c.Date_Item_was_Received__c';
import ITEM_ELIGIBLE_FIELD from '@salesforce/schema/Cares_Center_Item__c.Eligible_for_Item__c';
import CARES_BALANCE_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.ACO_Cares_Card__c';
import NO_SHOW_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.No_Show_Formula_for_Scanner__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getBarcodeScanner } from 'lightning/mobileCapabilities';
import createFoodAssistance from '@salesforce/apex/createAssistance.createFoodAssistance';
import createCaresCenterAssistance from '@salesforce/apex/createAssistance.createCaresCenterAssistance';
import createCaresCenterItem from '@salesforce/apex/createAssistance.createCaresCenterItem';
import updateNorthPoleAssistance from '@salesforce/apex/createAssistance.updateNorthPoleAssistance';
import updateSchoolSuppliesAssistance from '@salesforce/apex/createAssistance.updateSchoolSuppliesAssistance';
import updateSeminarAssistance from '@salesforce/apex/createAssistance.updateSeminarAssistance';
import getLastAssistanceDate from '@salesforce/apex/createAssistance.getLastAssistanceDate';
import getNumberKidsForNorthPole from '@salesforce/apex/createAssistance.getNumberKidsForNorthPole';
import getTotalNumberInHousehold from '@salesforce/apex/createAssistance.getTotalNumberInHousehold';
import getNorthPoleChildInfo from '@salesforce/apex/createAssistance.getNorthPoleChildInfo';
import getSchoolSuppliesChildInfo from '@salesforce/apex/createAssistance.getSchoolSuppliesChildInfo';
import getNumberBackpacks from '@salesforce/apex/createAssistance.getNumberBackpacks';
import getNumberKidsForSummerFood from '@salesforce/apex/createAssistance.getNumberKidsForSummerFood';
import getLaundryDetergent from '@salesforce/apex/createAssistance.getLaundryDetergent';
import getPaperTowel from '@salesforce/apex/createAssistance.getPaperTowel';
import getToiletPaper from '@salesforce/apex/createAssistance.getToiletPaper';
import getCaresCardBalance from '@salesforce/apex/createAssistance.getCaresCardBalance';
import updateCaresCardBalance from '@salesforce/apex/createAssistance.updateCaresCardBalance';
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
    caresCenterCheckedOut = false;

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
    selectedRows = [];
    laundryDetergentData = [];
    paperTowelData = [];
    toiletPaperData = [];
    poundsValue;

    selectedItemValue;
    workshopType;
    workshopName;
    saveDraftValues = [];

    foodPantryDateColumns = [
        {label: 'Last Date of Food Pantry Assistance', fieldName: ASSISTANCE_DATE_FIELD.fieldApiName, type: 'text'},
        {label: 'Eligible', fieldName: FOOD_ELIGIBLE_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getLastAssistanceDate, {contactId : '$scannedBarcode', recordTypeId : '01239000000EG3lAAG'})
    foodPantryDateResult;

    holidayFoodDateColumns = [
        {label: 'Last Date of Holiday Food Assistance', fieldName: ASSISTANCE_DATE_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getLastAssistanceDate, {contactId : '$scannedBarcode', recordTypeId : '0124z000000Q9xaAAC'})
    holidayFoodDateResult;

    summerFoodDateColumns = [
        {label: 'Last Date of Summer Food Assistance', fieldName: ASSISTANCE_DATE_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getLastAssistanceDate, {contactId : '$scannedBarcode', recordTypeId : '0124z000000JQpFAAW'})
    summerFoodDateResult;

    numberKidsSummerFoodColumns = [
        {label: '# Kids for Summer Food', fieldName: NUMBER_KIDS_SUMMER_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getNumberKidsForSummerFood, {contactId : '$scannedBarcode'})
    numberKidsSummerFoodResult;

    numberKidsNorthPoleColumns = [
        {label: '# Kids For North Pole', fieldName: NUMBER_KIDS_NP_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getNumberKidsForNorthPole, {contactId : '$scannedBarcode', recordTypeId : '012390000006CFBAA2'})
    numberKidsNorthPoleResult;
    
    northPoleChildInfoColumns = [
        {label: 'Name of Child', fieldName: CHILD_NAME_NP_FIELD.fieldApiName, type: 'text'},
        {label: 'Age', fieldName: CHILD_AGE_NP_FIELD.fieldApiName, type: 'text'},
        {label: 'Gender', fieldName: CHILD_GENDER_NP_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getNorthPoleChildInfo, {contactId : '$scannedBarcode', campaignName : '$nameOfCampaign'})
    northPoleChildInfoResult;

    schoolSuppliesDateColumns = [
        {label: 'Last School Supplies Application', fieldName: ASSISTANCE_DATE_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getLastAssistanceDate, {contactId : '$scannedBarcode', recordTypeId : '012390000006CF1AAM'})
    schoolSuppliesDateResult;

    numberKidsSchoolSuppliesColumns = [
        {label: '# Kids For School Supplies', fieldName: NUMBER_KIDS_SS_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getNumberBackpacks, {contactId : '$scannedBarcode', recordTypeId : '012390000006CF1AAM'})
    numberKidsSchoolSuppliesResult;

    schoolSuppliesChildInfoColumns = [
        {label: 'Name of Child', fieldName: CHILD_NAME_SS_FIELD.fieldApiName, type: 'text'},
        {label: 'Age', fieldName: CHILD_AGE_SS_FIELD.fieldApiName, type: 'text'},
        {label: 'Grade', fieldName: CHILD_GRADE_SS_FIELD.fieldApiName, type: 'text'},
        {label: 'Gender', fieldName: CHILD_GENDER_SS_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getSchoolSuppliesChildInfo, {contactId : '$scannedBarcode', campaignName : '$nameOfCampaignSS'})
    schoolSuppliesChildInfoResult;

    caresCenterDateColumns = [
        {label: 'Last Cares Center Visit', fieldName: ASSISTANCE_DATE_FIELD.fieldApiName, type: 'text'},
        {label: 'Eligible', fieldName: FOOD_ELIGIBLE_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getLastAssistanceDate, {contactId : '$scannedBarcode', recordTypeId : '012Nt000000plo5IAA'})
    caresCenterDateResult;

    laundryDetergentColumns = [
        {label: 'Laundry Detergent', fieldName: ITEM_DATE_FIELD.fieldApiName, type: 'text'},
        {label: 'Eligible', fieldName: ITEM_ELIGIBLE_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getLaundryDetergent, {contactId : '$scannedBarcode'})
    laundryDetergent({error, data}) {
        if (data) {
            // Check if the data array is empty
            if (data.length == 0) {
                // If the data array is empty, assign a placeholder row
                this.laundryDetergentData = [{
                    Id: 'placeholder-laundry-detergent-' + this.scannedBarcode,
                    Name: 'Laundry Detergent',
                    Date_Item_was_Received__c: null,
                    Eligible_for_Item__c: null
                }];
            } else {
                // If data is available, assign it to the component property
                this.laundryDetergentData = JSON.parse(JSON.stringify(data));
            }
        } else if (error) {
            console.error('Error fetching data:', error);
        }
    }

    paperTowelColumns = [
        {label: 'Paper Towel', fieldName: ITEM_DATE_FIELD.fieldApiName, type: 'text'},
        {label: 'Eligible', fieldName: ITEM_ELIGIBLE_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getPaperTowel, {contactId : '$scannedBarcode'})
    paperTowel({error, data}) {
        if (data) {
            // Check if the data array is empty
            if (data.length == 0) {
                // If the data array is empty, assign a placeholder row
                this.paperTowelData = [{
                    Id: 'placeholder-paper-towel-' + this.scannedBarcode,
                    Name: 'Paper Towel',
                    Date_Item_was_Received__c: null,
                    Eligible_for_Item__c: null
                }];
            } else {
                // If data is available, assign it to the component property
                this.paperTowelData = JSON.parse(JSON.stringify(data));
            }
        } else if (error) {
            console.error('Error fetching data:', error);
        }
    }

    toiletPaperColumns = [
        {label: 'Toilet Paper', fieldName: ITEM_DATE_FIELD.fieldApiName, type: 'text'},
        {label: 'Eligible', fieldName: ITEM_ELIGIBLE_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getToiletPaper, {contactId : '$scannedBarcode'})
    toiletPaper({error, data}) {
        if (data) {
            // Check if the data array is empty
            if (data.length == 0) {
                // If the data array is empty, assign a placeholder row
                this.toiletPaperData = [{
                    Id: 'placeholder-toilet-paper-' + this.scannedBarcode,
                    Name: 'Toilet Paper',
                    Date_Item_was_Received__c: null,
                    Eligible_for_Item__c: null
                }];
            } else {
                // If data is available, assign it to the component property
                this.toiletPaperData = JSON.parse(JSON.stringify(data));
            }
        } else if (error) {
            console.error('Error fetching data:', error);
        }
    }

    caresCardBalanceColumns = [
        {label: 'Cares Account Balance', fieldName: CARES_BALANCE_FIELD.fieldApiName, type: 'number', editable: true}
    ];
    @wire(getCaresCardBalance, {contactId : '$scannedBarcode'})
    caresCardBalanceResult;

    householdSizeColumns = [
        {label: 'Total # in Household', fieldName: NUMBER_HOUSEHOLD_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getTotalNumberInHousehold, {contactId : '$scannedBarcode'})
    totalNumberInHouseholdResult;

    foodNoShowStatusColumns = [
        {label: 'No Show for Last Visit?', fieldName: NO_SHOW_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getNoShowStatus, {contactId : '$scannedBarcode', recordTypeId: '01239000000EG3lAAG'})
    foodNoShowStatusResult;

    caresNoShowStatusColumns = [
        {label: 'No Show for Last Visit?', fieldName: NO_SHOW_FIELD.fieldApiName, type: 'text'}
    ];
    @wire(getNoShowStatus, {contactId : '$scannedBarcode', recordTypeId: '012Nt000000plo5IAA'})
    caresNoShowStatusResult;

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

    @wire(getScannedContacts, {eventType: 'Cares Center'})
    wiredScannedContactsCaresResult;
    
    @wire(getScannedContacts, {eventType: 'Food Pantry'})
    wiredScannedContactsFoodResult;

    get caresScannedContacts() {
        return this.wiredScannedContactsCaresResult?.data || [];
    }
    
    get foodScannedContacts() {
        return this.wiredScannedContactsFoodResult?.data || [];
    }

    // When component is initialized, detect whether to enable Scan button
    connectedCallback() {
        this.myScanner = getBarcodeScanner();
        if (this.myScanner == null || !this.myScanner.isAvailable()) {
            this.scanButtonDisabled = true;
        }
        this.scannedBarcode = null;
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
        this.selectedRows = [];
        this.totalAmount = 0;
        this.poundsValue = '';
        this.isSuspended = false;
        this.locationSuspended = '';

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
                    if (this.northPoleVal) {
                        updateNorthPoleAssistance({contactId : this.scannedBarcode});
                        this.northPoleAssistanceUpdated = true;
                    }
                    if (this.schoolSuppliesVal) {
                        updateSchoolSuppliesAssistance({contactId : this.scannedBarcode});
                        this.schoolSuppliesAssistanceUpdated = true;
                    }
                    if (this.caresCenterVal) {
                        createCaresCenterAssistance({contactId : this.scannedBarcode, recordTypeId: '012Nt000000plo5IAA', amountSpent: 0});
                        setTimeout(() => {
                            createScannedContact({contactId: this.scannedBarcode, contactName: this.contactName, eventType: 'Cares Center'})
                                .then(() => {
                                    // Refresh the data after creation
                                    return refreshApex(this.wiredScannedContactsCaresResult);
                                })
                                .catch(error => console.error('Error creating Scanned Contact:', error));
                        }, 2000);
                        this.locationSuspended = 'Cares Center';
                    }
                    if (this.foodPantryVal) {
                        setTimeout(() => {
                            createScannedContact({contactId: this.scannedBarcode, contactName: this.contactName, eventType: 'Food Pantry'})
                                .then(() => {
                                    // Refresh the data after creation
                                    return refreshApex(this.wiredScannedContactsFoodResult);
                                })
                                .catch(error => console.error('Error creating Scanned Contact:', error));
                        }, 2000);
                        this.locationSuspended = 'Food Pantry';
                    }
                    if (this.learningAcademyVal) {
                        updateSeminarAssistance({contactId : this.scannedBarcode, typeOfWorkshop: this.workshopType, workshopName: this.workshopName});
                        this.seminarAssistanceUpdated = true;
                    }
                    isContactSuspended({contactId: this.scannedBarcode, location: this.locationSuspended})
                        .then(result => {
                            this.isSuspended = result;
                        })
                        .catch(error => {
                            console.error('Error checking suspension:', error);
                        });
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
        createCaresCenterAssistance({contactId : this.scannedBarcode, recordTypeId: '012Nt000000plo5IAA', amountSpent: this.totalAmount});
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

        deleteScannedContact({contactId: this.scannedBarcode, eventType: 'Cares Center'})
            .then(() => {
                // Refresh the data after deletion
                return refreshApex(this.wiredScannedContactsCaresResult);
            })
            .catch(error => console.error('Error deleting Scanned Contact:', error));

        this.caresCenterCheckedOut = true;
    }

    handleFoodPantryDeleteScan() {
        deleteScannedContact({contactId: this.scannedBarcode, eventType: 'Food Pantry'})
        .then(() => {
            // Refresh the data after deletion
            return refreshApex(this.wiredScannedContactsFoodResult);
        })
        .catch(error => console.error('Error deleting Scanned Contact:', error));
    }

    handleCaresCenterDeleteScan() {
        deleteScannedContact({contactId: this.scannedBarcode, eventType: 'Cares Center'})
        .then(() => {
            // Refresh the data after deletion
            return refreshApex(this.wiredScannedContactsCaresResult);
        })
        .catch(error => console.error('Error deleting Scanned Contact:', error));
    }
    
    async handleSwitchContactCares(event) {
        const contactId = event.currentTarget.dataset.id;
        const contact = this.caresScannedContacts.find(item => item.Contact_ID__c == contactId);
    
        if (contact) {
            this.scannedBarcode = contact.Contact_ID__c;
            this.contactName = contact.Contact_Name__c;
            this.caresCenterCheckedOut = false; 
            this.selectedRows = [];
            this.totalAmount = 0;
        }

        isContactSuspended({contactId: this.scannedBarcode, location: this.locationSuspended})
            .then(result => {
                this.isSuspended = result;
            })
            .catch(error => {
                console.error('Error checking suspension:', error);
            });
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

    handleRefreshFood() {
        refreshApex(this.wiredScannedContactsFoodResult);
    }

    handleRefreshCares() {
        refreshApex(this.wiredScannedContactsCaresResult);
    }

    // This function is used to refresh the table once data updated
    async refresh() {
        await refreshApex(this.caresCardBalanceResult);
        await refreshApex(this.schoolSuppliesBalance);
    }
}