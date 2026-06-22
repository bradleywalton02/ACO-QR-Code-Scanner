import { LightningElement, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import ASSISTANCE_DATE_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Date_of_Assistance__c';
import NUMBER_KIDS_FIELD from '@salesforce/schema/Case.Children_in_Your_Home_0_17__c';
import NUMBER_HOUSEHOLD_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Total_Number_in_Household__c';
import FOOD_ELIGIBLE_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.Eligible_for_Food_Pantry_Shopping__c';
import NO_SHOW_FIELD from '@salesforce/schema/c4g_Client_Assistance__c.No_Show_Formula_for_Scanner__c';

import createFoodAssistance from '@salesforce/apex/createAssistance.createFoodAssistance';
import getLastAssistanceDate from '@salesforce/apex/createAssistance.getLastAssistanceDate';
import getTotalNumberInHousehold from '@salesforce/apex/createAssistance.getTotalNumberInHousehold';
import getNumberKidsForSummerFood from '@salesforce/apex/createAssistance.getNumberKidsForSummerFood';
import getNoShowStatus from '@salesforce/apex/createAssistance.getNoShowStatus';
import getScannedContacts from '@salesforce/apex/createAssistance.getScannedContacts';
import deleteScannedContact from '@salesforce/apex/createAssistance.deleteScannedContact';

const FOOD_PANTRY_RECORD_TYPE_ID = '01239000000EG3lAAG';
const HOLIDAY_FOOD_RECORD_TYPE_ID = '0124z000000Q9xaAAC';
const SUMMER_FOOD_RECORD_TYPE_ID = '0124z000000JQpFAAW';
const FOOD_PANTRY_EVENT_TYPE = 'Food Pantry';

export default class FoodPantryPanel extends LightningElement {
    activeContactId;
    activeContactName;

    @api holidayActive = false;
    @api kidsSummerActive = false;

    @api
    get contactId() {
        return this.activeContactId;
    }
    set contactId(value) {
        this.activeContactId = value;
        this.resetStateForContact();
    }

    @api
    get contactName() {
        return this.activeContactName;
    }
    set contactName(value) {
        this.activeContactName = value;
    }

    poundsValue = '';
    foodPantryAssistanceCreated = false;
    holidayFoodAssistanceCreated = false;
    summerFoodAssistanceCreated = false;
    isFoodPanelLocked = false;

    foodPantryDateColumns = [
        { label: 'Last Date of Food Pantry Assistance', fieldName: ASSISTANCE_DATE_FIELD.fieldApiName, type: 'text', resizable: false },
        { label: 'Eligible', fieldName: FOOD_ELIGIBLE_FIELD.fieldApiName, type: 'text', resizable: false }
    ];
    @wire(getLastAssistanceDate, { contactId: '$activeContactId', recordTypeId: FOOD_PANTRY_RECORD_TYPE_ID })
    foodPantryDateResult;

    householdSizeColumns = [
        { label: 'Total # in Household', fieldName: NUMBER_HOUSEHOLD_FIELD.fieldApiName, type: 'text', resizable: false }
    ];
    @wire(getTotalNumberInHousehold, { contactId: '$activeContactId' })
    totalNumberInHouseholdResult;

    foodNoShowStatusColumns = [
        { label: 'No Show for Last Visit?', fieldName: NO_SHOW_FIELD.fieldApiName, type: 'text', resizable: false }
    ];
    @wire(getNoShowStatus, { contactId: '$activeContactId', recordTypeId: FOOD_PANTRY_RECORD_TYPE_ID })
    foodNoShowStatusResult;

    holidayFoodDateColumns = [
        { label: 'Last Date of Holiday Food Assistance', fieldName: ASSISTANCE_DATE_FIELD.fieldApiName, type: 'text', resizable: false }
    ];
    @wire(getLastAssistanceDate, { contactId: '$activeContactId', recordTypeId: HOLIDAY_FOOD_RECORD_TYPE_ID })
    holidayFoodDateResult;

    summerFoodDateColumns = [
        { label: 'Last Date of Summer Food Assistance', fieldName: ASSISTANCE_DATE_FIELD.fieldApiName, type: 'text', resizable: false }
    ];
    @wire(getLastAssistanceDate, { contactId: '$activeContactId', recordTypeId: SUMMER_FOOD_RECORD_TYPE_ID })
    summerFoodDateResult;

    numberKidsSummerFoodColumns = [
        { label: '# Kids for Summer Food', fieldName: NUMBER_KIDS_FIELD.fieldApiName, type: 'text', resizable: false }
    ];
    @wire(getNumberKidsForSummerFood, { contactId: '$activeContactId' })
    numberKidsSummerFoodResult;

    @wire(getScannedContacts, { eventType: FOOD_PANTRY_EVENT_TYPE })
    wiredScannedContactsFoodResult;

    get foodScannedContacts() {
        return this.wiredScannedContactsFoodResult?.data || [];
    }

    resetStateForContact() {
        this.poundsValue = '';
        this.foodPantryAssistanceCreated = false;
        this.holidayFoodAssistanceCreated = false;
        this.summerFoodAssistanceCreated = false;
        this.isFoodPanelLocked = false;
    }

    handlePounds(event) {
        this.poundsValue = event.detail.value;
    }

    async handleCreateFoodPantryAssistance() {
        const checkoutContactId = this.activeContactId;
        this.isFoodPanelLocked = true;

        try {
            if (!checkoutContactId) {
                throw new Error('No Food Pantry contact is currently selected.');
            }

            if (this.poundsValue <= 0) {
                this.showToast('Validation Error', 'Pounds value cannot be zero or negative.', 'error');
                this.isFoodPanelLocked = false;
                return;
            }

            await createFoodAssistance({
                contactId: checkoutContactId,
                recordTypeId: FOOD_PANTRY_RECORD_TYPE_ID,
                typeOfAssistance: 'Food Pantry',
                pounds: this.poundsValue
            });

            await this.deleteScannedContactForContact(checkoutContactId, false);
            await this.refreshFoodData();

            this.foodPantryAssistanceCreated = true;
            this.showToast('Assistance Created', 'Food Pantry Assistance created successfully.', 'success');
        } catch (error) {
            this.showToast('Creating Assistance Failed', `Failed to create assistance: ${this.reduceError(error)}`, 'error');
        } finally {
            this.isFoodPanelLocked = false;
        }
    }

    async handleCreateHolidayFoodAssistance() {
        this.isFoodPanelLocked = true;

        try {
            await createFoodAssistance({
                contactId: this.activeContactId,
                recordTypeId: HOLIDAY_FOOD_RECORD_TYPE_ID,
                typeOfAssistance: 'Holiday Food',
                pounds: 1
            });
            this.holidayFoodAssistanceCreated = true;
            this.showToast('Assistance Created', 'Holiday Food Assistance created successfully.', 'success');
        } catch (error) {
            this.showToast('Holiday Food Error', `Failed to create assistance: ${this.reduceError(error)}`, 'error');
        } finally {
            this.isFoodPanelLocked = false;
        }
    }

    async handleCreateSummerFoodAssistance() {
        this.isFoodPanelLocked = true;

        try {
            await createFoodAssistance({
                contactId: this.activeContactId,
                recordTypeId: SUMMER_FOOD_RECORD_TYPE_ID,
                typeOfAssistance: 'Summer Food',
                pounds: 1
            });
            this.summerFoodAssistanceCreated = true;
            this.showToast('Assistance Created', 'Summer Food Assistance created successfully.', 'success');
        } catch (error) {
            this.showToast('Summer Food Error', `Failed to create assistance: ${this.reduceError(error)}`, 'error');
        } finally {
            this.isFoodPanelLocked = false;
        }
    }

    async handleRefreshFood() {
        await this.refreshFoodData();
        this.showToast('Refreshed', 'Food Pantry data refreshed.', 'success');
    }

    @api
    async refreshScannedContactList() {
        try {
            if (this.wiredScannedContactsFoodResult) {
                await refreshApex(this.wiredScannedContactsFoodResult);
            }
        } catch (error) {
            console.error('Error refreshing Food Pantry scanned contact list:', error);
        }
    }

    async refreshFoodData() {
        const refreshes = [];

        if (this.foodPantryDateResult) refreshes.push(refreshApex(this.foodPantryDateResult));
        if (this.totalNumberInHouseholdResult) refreshes.push(refreshApex(this.totalNumberInHouseholdResult));
        if (this.foodNoShowStatusResult) refreshes.push(refreshApex(this.foodNoShowStatusResult));
        if (this.holidayFoodDateResult) refreshes.push(refreshApex(this.holidayFoodDateResult));
        if (this.summerFoodDateResult) refreshes.push(refreshApex(this.summerFoodDateResult));
        if (this.numberKidsSummerFoodResult) refreshes.push(refreshApex(this.numberKidsSummerFoodResult));
        if (this.wiredScannedContactsFoodResult) refreshes.push(refreshApex(this.wiredScannedContactsFoodResult));

        await Promise.all(refreshes);
    }

    async handleSwitchContactFood(event) {
        const contactId = event.currentTarget.dataset.id;
        const contact = this.foodScannedContacts.find(item => item.Contact_ID__c == contactId);

        if (!contact) {
            return;
        }

        this.activeContactId = contact.Contact_ID__c;
        this.activeContactName = contact.Contact_Name__c;
        this.resetStateForContact();

        this.dispatchEvent(new CustomEvent('contactchange', {
            detail: {
                contactId: this.activeContactId,
                contactName: this.activeContactName
            }
        }));
    }

    async handleFoodPantryDeleteScan() {
        try {
            await this.deleteScannedContactForContact(this.activeContactId, true);
            await this.refreshFoodData();
            this.showToast('Removed', 'Contact removed from Food Pantry list.', 'success');
        } catch (error) {
            this.showToast('Delete Failed', `Could not remove contact from the scanned list: ${this.reduceError(error)}`, 'error');
        }
    }

    async deleteScannedContactForContact(contactId, showErrorIfMissing) {
        if (!contactId) {
            if (showErrorIfMissing) {
                throw new Error('No Food Pantry contact is currently selected.');
            }
            return;
        }

        await deleteScannedContact({
            contactId,
            eventType: FOOD_PANTRY_EVENT_TYPE
        });
    }

    showToast(title, message, variant = 'info') {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
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