@isTest
private class createAssistanceTest {
    private static final Id FOOD_ASSISTANCE_RECORD_TYPE_ID = '01239000000EG3lAAG';
    private static final Id CARES_ASSISTANCE_RECORD_TYPE_ID = '012Nt000000plo5IAA';
    private static final Id NORTH_POLE_ASSISTANCE_RECORD_TYPE_ID = '012390000006CFBAA2';
    private static final Id SCHOOL_SUPPLIES_ASSISTANCE_RECORD_TYPE_ID = '012390000006CF1AAM';
    private static final Id SEMINAR_ASSISTANCE_RECORD_TYPE_ID = '0124z000000xUd0AAE';
    private static final Id CARES_ACCOUNT_RECORD_TYPE_ID = '0124z000000xUcgAAE';

    private static Contact makeContact(String lastName) {
        Contact c = new Contact(FirstName = 'Test', LastName = lastName);
        insert c;
        return c;
    }

    private static void assertAuraHandledException(Boolean didThrow, String methodName) {
        System.assertEquals(true, didThrow, methodName + ' should throw a friendly AuraHandledException when required data is missing.');
    }

    @isTest
    static void testReadMethodsReturnEmptyListsWhenNoDataExists() {
        Contact c = makeContact('Read Methods');

        Test.startTest();
        System.assertEquals(0, createAssistance.getLastAssistanceDate(c.Id, FOOD_ASSISTANCE_RECORD_TYPE_ID).size());
        System.assertEquals(0, createAssistance.getNumberKidsForSummerFood(c.Id).size());
        System.assertEquals(0, createAssistance.getTotalNumberInHousehold(c.Id).size());
        System.assertEquals(0, createAssistance.getNumberKidsForNorthPole(c.Id, NORTH_POLE_ASSISTANCE_RECORD_TYPE_ID).size());
        System.assertEquals(0, createAssistance.getNorthPoleChildInfo(c.Id, 'North Pole ' + Date.today().year() + ' Sign Ups').size());
        System.assertEquals(0, createAssistance.getNumberBackpacks(c.Id, SCHOOL_SUPPLIES_ASSISTANCE_RECORD_TYPE_ID).size());
        System.assertEquals(0, createAssistance.getSchoolSuppliesChildInfo(c.Id, 'School Supplies ' + Date.today().year() + ' Sign Ups').size());
        System.assertEquals(0, createAssistance.getNoShowStatus(c.Id, FOOD_ASSISTANCE_RECORD_TYPE_ID).size());
        System.assertEquals(0, createAssistance.getScannedContacts('Food Pantry').size());
        System.assertEquals(0, createAssistance.getLaundryDetergent(c.Id).size());
        System.assertEquals(0, createAssistance.getPaperTowel(c.Id).size());
        System.assertEquals(0, createAssistance.getToiletPaper(c.Id).size());
        System.assertEquals(0, createAssistance.getCaresCardBalance(c.Id).size());
        System.assertEquals(false, createAssistance.isContactSuspended(c.Id, 'Food Pantry'));
        Test.stopTest();
    }

    @isTest
    static void testReadMethodsHandleNullInputs() {
        Test.startTest();
        System.assertEquals(0, createAssistance.getLastAssistanceDate(null, null).size());
        System.assertEquals(0, createAssistance.getNumberKidsForSummerFood(null).size());
        System.assertEquals(0, createAssistance.getTotalNumberInHousehold(null).size());
        System.assertEquals(0, createAssistance.getNumberKidsForNorthPole(null, null).size());
        System.assertEquals(0, createAssistance.getNorthPoleChildInfo(null, null).size());
        System.assertEquals(0, createAssistance.getNumberBackpacks(null, null).size());
        System.assertEquals(0, createAssistance.getSchoolSuppliesChildInfo(null, null).size());
        System.assertEquals(0, createAssistance.getNoShowStatus(null, null).size());
        System.assertEquals(0, createAssistance.getScannedContacts(null).size());
        System.assertEquals(0, createAssistance.getLaundryDetergent(null).size());
        System.assertEquals(0, createAssistance.getPaperTowel(null).size());
        System.assertEquals(0, createAssistance.getToiletPaper(null).size());
        System.assertEquals(0, createAssistance.getCaresCardBalance(null).size());
        System.assertEquals(false, createAssistance.isContactSuspended(null, null));
        Test.stopTest();
    }

    @isTest
    static void testScannedContactCreateAndDelete() {
        Contact c = makeContact('Scanned Contact');

        Test.startTest();
        createAssistance.createScannedContact(c.Id, 'Food Pantry');
        createAssistance.createScannedContact(c.Id, 'Food Pantry'); // duplicate should safely no-op
        List<Scanned_Contact__c> scanned = createAssistance.getScannedContacts('Food Pantry');
        System.assertEquals(1, scanned.size(), 'Duplicate scanned contacts should not be created for the same contact/event.');

        createAssistance.deleteScannedContact(c.Id, 'Food Pantry');
        System.assertEquals(0, createAssistance.getScannedContacts('Food Pantry').size());
        Test.stopTest();
    }

    @isTest
    static void testCreateFoodAssistanceMissingServiceThrowsFriendlyError() {
        Contact c = makeContact('No Food Service');
        Boolean didThrow = false;

        Test.startTest();
        try {
            createAssistance.createFoodAssistance(c.Id, FOOD_ASSISTANCE_RECORD_TYPE_ID, 'Food Pantry', 25);
        } catch (AuraHandledException e) {
            didThrow = true;
        }
        Test.stopTest();

        assertAuraHandledException(didThrow, 'createFoodAssistance');
    }

    @isTest
    static void testCreateCaresCenterAssistanceMissingServiceThrowsFriendlyError() {
        Contact c = makeContact('No Cares Service');
        Boolean didThrow = false;

        Test.startTest();
        try {
            createAssistance.createCaresCenterAssistance(c.Id, CARES_ASSISTANCE_RECORD_TYPE_ID, 17);
        } catch (AuraHandledException e) {
            didThrow = true;
        }
        Test.stopTest();

        assertAuraHandledException(didThrow, 'createCaresCenterAssistance');
    }

    @isTest
    static void testCreateCaresCenterItemMissingAssistanceThrowsFriendlyError() {
        Contact c = makeContact('No Cares Assistance');
        Boolean didThrow = false;

        Test.startTest();
        try {
            createAssistance.createCaresCenterItem(c.Id, 'Laundry Detergent');
        } catch (AuraHandledException e) {
            didThrow = true;
        }
        Test.stopTest();

        assertAuraHandledException(didThrow, 'createCaresCenterItem');
    }

    @isTest
    static void testUpdateMethodsMissingAssistanceThrowFriendlyErrors() {
        Contact c = makeContact('No Assistance');

        Boolean northPoleThrew = false;
        Boolean schoolSuppliesThrew = false;
        Boolean seminarThrew = false;
        Boolean specialEventThrew = false;
        Boolean caresCardThrew = false;

        Test.startTest();
        try {
            createAssistance.updateNorthPoleAssistance(c.Id);
        } catch (AuraHandledException e) {
            northPoleThrew = true;
        }

        try {
            createAssistance.updateSchoolSuppliesAssistance(c.Id);
        } catch (AuraHandledException e) {
            schoolSuppliesThrew = true;
        }

        try {
            createAssistance.updateSeminarAssistance(c.Id, 'Financial Workshop', 'Budgeting 101');
        } catch (AuraHandledException e) {
            seminarThrew = true;
        }

        try {
            createAssistance.updateSpecialEventBalance(c.Id, SCHOOL_SUPPLIES_ASSISTANCE_RECORD_TYPE_ID, 2.50);
        } catch (AuraHandledException e) {
            specialEventThrew = true;
        }

        try {
            createAssistance.updateCaresCardBalance(c.Id, 2.50);
        } catch (AuraHandledException e) {
            caresCardThrew = true;
        }
        Test.stopTest();

        assertAuraHandledException(northPoleThrew, 'updateNorthPoleAssistance');
        assertAuraHandledException(schoolSuppliesThrew, 'updateSchoolSuppliesAssistance');
        assertAuraHandledException(seminarThrew, 'updateSeminarAssistance');
        assertAuraHandledException(specialEventThrew, 'updateSpecialEventBalance');
        assertAuraHandledException(caresCardThrew, 'updateCaresCardBalance');
    }

    @isTest
    static void testValidationErrors() {
        Contact c = makeContact('Validation');
        Boolean missingPoundsThrew = false;
        Boolean missingItemNameThrew = false;
        Boolean missingContactThrew = false;

        Test.startTest();
        try {
            createAssistance.createFoodAssistance(c.Id, FOOD_ASSISTANCE_RECORD_TYPE_ID, 'Food Pantry', 0);
        } catch (AuraHandledException e) {
            missingPoundsThrew = true;
        }

        try {
            createAssistance.createCaresCenterItem(c.Id, null);
        } catch (AuraHandledException e) {
            missingItemNameThrew = true;
        }

        try {
            createAssistance.createScannedContact(null, 'Food Pantry');
        } catch (AuraHandledException e) {
            missingContactThrew = true;
        }
        Test.stopTest();

        assertAuraHandledException(missingPoundsThrew, 'createFoodAssistance pounds validation');
        assertAuraHandledException(missingItemNameThrew, 'createCaresCenterItem item validation');
        assertAuraHandledException(missingContactThrew, 'createScannedContact contact validation');
    }
}