public with sharing class createAssistance {
    private static final Id FOOD_SERVICE_RECORD_TYPE_ID = '012390000006CWdAAM';
    private static final Id CARES_SERVICE_RECORD_TYPE_ID = '01239000000AmBwAAK';
    private static final Id CARES_VISIT_ASSISTANCE_RECORD_TYPE_ID = '012Nt000000plo5IAA';
    private static final Id NORTH_POLE_ASSISTANCE_RECORD_TYPE_ID = '012390000006CFBAA2';
    private static final Id SCHOOL_SUPPLIES_ASSISTANCE_RECORD_TYPE_ID = '012390000006CF1AAM';
    private static final Id SEMINAR_ASSISTANCE_RECORD_TYPE_ID = '0124z000000xUd0AAE';
    private static final Id CARES_ACCOUNT_RECORD_TYPE_ID = '0124z000000xUcgAAE';
    private static final Id CARES_AMOUNT_SPENT_TRACKER_CONTACT_ID = '003Nt00000DrKHKIA3';

    // ---------------------------------------------------------------------
    // Small helper methods
    // ---------------------------------------------------------------------
    private static void requireContactId(Id contactId) {
        if (contactId == null) {
            throw new AuraHandledException('No contact was selected or scanned. Please scan a valid QR code first.');
        }
    }

    private static void requireRecordTypeId(Id recordTypeId) {
        if (recordTypeId == null) {
            throw new AuraHandledException('Missing Record Type Id. Please contact your Salesforce administrator.');
        }
    }

    private static String safeMessage(Exception e) {
        return e == null ? 'Unknown error' : e.getMessage();
    }

    private static Contact getContactOrThrow(Id contactId) {
        requireContactId(contactId);
        List<Contact> contacts = [
            SELECT Id, Name
            FROM Contact
            WHERE Id = :contactId
            LIMIT 1
        ];

        if (contacts.isEmpty()) {
            throw new AuraHandledException('No Contact was found for the scanned QR code.');
        }

        return contacts[0];
    }

    private static c4g_Client_Service__c getLatestClientServiceOrThrow(Id contactId, Id serviceRecordTypeId, String serviceName) {
        requireContactId(contactId);
        requireRecordTypeId(serviceRecordTypeId);

        List<c4g_Client_Service__c> services = [
            SELECT Id, c4g_Case__c
            FROM c4g_Client_Service__c
            WHERE c4g_Client__c = :contactId
            AND RecordTypeId = :serviceRecordTypeId
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];

        if (services.isEmpty()) {
            throw new AuraHandledException('No ' + serviceName + ' Client Service record was found for this contact. Please create the Client Service first, then try again.');
        }

        return services[0];
    }

    private static c4g_Client_Assistance__c getLatestAssistanceOrThrow(Id contactId, Id assistanceRecordTypeId, String assistanceName) {
        requireContactId(contactId);
        requireRecordTypeId(assistanceRecordTypeId);

        List<c4g_Client_Assistance__c> assistanceRecords = [
            SELECT Id
            FROM c4g_Client_Assistance__c
            WHERE c4g_Client__c = :contactId
            AND RecordTypeId = :assistanceRecordTypeId
            ORDER BY Date_of_Assistance__c DESC, CreatedDate DESC
            LIMIT 1
        ];

        if (assistanceRecords.isEmpty()) {
            throw new AuraHandledException('No ' + assistanceName + ' Assistance record was found for this contact.');
        }

        return assistanceRecords[0];
    }

    // ---------------------------------------------------------------------
    // Read-only methods used by @wire in the LWC
    // ---------------------------------------------------------------------
    @AuraEnabled(cacheable=true)
    public static List<c4g_Client_Assistance__c> getLastAssistanceDate(Id contactId, Id recordTypeId) {
        if (contactId == null || recordTypeId == null) return new List<c4g_Client_Assistance__c>();

        return [
            SELECT Date_of_Assistance__c, Eligible_for_Food_Pantry_Shopping__c
            FROM c4g_Client_Assistance__c
            WHERE c4g_Client__c = :contactId
            AND RecordTypeId = :recordTypeId
            ORDER BY Date_of_Assistance__c DESC, CreatedDate DESC
            LIMIT 1
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Case> getNumberKidsForSummerFood(Id contactId) {
        if (contactId == null) return new List<Case>();

        return [
            SELECT Children_in_Your_Home_0_17__c
            FROM Case
            WHERE ContactId = :contactId
            ORDER BY Date_Created__c DESC, CreatedDate DESC
            LIMIT 1
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Case> getTotalNumberInHousehold(Id contactId) {
        if (contactId == null) return new List<Case>();

        return [
            SELECT Total_Number_in_Household__c
            FROM Case
            WHERE ContactId = :contactId
            ORDER BY Date_Created__c DESC, CreatedDate DESC
            LIMIT 1
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<c4g_Client_Assistance__c> getNumberKidsForNorthPole(Id contactId, Id recordTypeId) {
        if (contactId == null || recordTypeId == null) return new List<c4g_Client_Assistance__c>();

        return [
            SELECT of_Children_Receiving_Toys__c
            FROM c4g_Client_Assistance__c
            WHERE c4g_Client__c = :contactId
            AND RecordTypeId = :recordTypeId
            ORDER BY Date_of_Assistance__c DESC, CreatedDate DESC
            LIMIT 1
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Holiday__c> getNorthPoleChildInfo(Id contactId, String campaignName) {
        if (contactId == null || String.isBlank(campaignName)) return new List<Holiday__c>();

        return [
            SELECT Child_Name__c, Child_Age__c, Gender__c
            FROM Holiday__c
            WHERE Contact__c = :contactId
            AND Campaign_Name__c = :campaignName
            ORDER BY Child_Age__c DESC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<c4g_Client_Assistance__c> getNumberBackpacks(Id contactId, Id recordTypeId) {
        if (contactId == null || recordTypeId == null) return new List<c4g_Client_Assistance__c>();

        return [
            SELECT of_Children_Receiving_School_Supplies__c
            FROM c4g_Client_Assistance__c
            WHERE c4g_Client__c = :contactId
            AND RecordTypeId = :recordTypeId
            ORDER BY Date_of_Assistance__c DESC, CreatedDate DESC
            LIMIT 1
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<SS_Child__c> getSchoolSuppliesChildInfo(Id contactId, String campaignName) {
        if (contactId == null || String.isBlank(campaignName)) return new List<SS_Child__c>();

        return [
            SELECT Child_Name__c, Child_Age__c, Child_Grade__c, Child_Gender__c
            FROM SS_Child__c
            WHERE Contact__c = :contactId
            AND Campaign_Name__c = :campaignName
            ORDER BY Child_Age__c DESC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<c4g_Client_Assistance__c> getNoShowStatus(Id contactId, Id recordTypeId) {
        if (contactId == null || recordTypeId == null) return new List<c4g_Client_Assistance__c>();

        return [
            SELECT No_Show_Formula_for_Scanner__c
            FROM c4g_Client_Assistance__c
            WHERE c4g_Client__c = :contactId
            AND RecordTypeId = :recordTypeId
            ORDER BY Date_of_Assistance__c DESC, CreatedDate DESC
            LIMIT 1
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Scanned_Contact__c> getScannedContacts(String eventType) {
        if (String.isBlank(eventType)) return new List<Scanned_Contact__c>();

        return [
            SELECT Id, Contact_ID__c, Contact_Name__c, Event_Type__c
            FROM Scanned_Contact__c
            WHERE Event_Type__c = :eventType
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Cares_Center_Item__c> getLaundryDetergent(Id contactId) {
        return getLatestCaresItem(contactId, 'Laundry Detergent');
    }

    @AuraEnabled(cacheable=true)
    public static List<Cares_Center_Item__c> getPaperTowel(Id contactId) {
        return getLatestCaresItem(contactId, 'Paper Towel');
    }

    @AuraEnabled(cacheable=true)
    public static List<Cares_Center_Item__c> getToiletPaper(Id contactId) {
        return getLatestCaresItem(contactId, 'Toilet Paper');
    }

    private static List<Cares_Center_Item__c> getLatestCaresItem(Id contactId, String itemName) {
        if (contactId == null || String.isBlank(itemName)) return new List<Cares_Center_Item__c>();

        return [
            SELECT Id, Name, Date_Item_was_Received__c, Eligible_for_Item__c
            FROM Cares_Center_Item__c
            WHERE Contact__c = :contactId
            AND Name = :itemName
            ORDER BY Date_Item_was_Received__c DESC, CreatedDate DESC
            LIMIT 1
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<c4g_Client_Assistance__c> getCaresCardBalance(Id contactId) {
        if (contactId == null) return new List<c4g_Client_Assistance__c>();

        return [
            SELECT ACO_Cares_Card__c
            FROM c4g_Client_Assistance__c
            WHERE c4g_Client__c = :contactId
            AND RecordTypeId = :CARES_ACCOUNT_RECORD_TYPE_ID
            ORDER BY Date_of_Assistance__c DESC, CreatedDate DESC
            LIMIT 1
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Boolean isContactSuspended(Id contactId, String location) {
        if (contactId == null || String.isBlank(location)) return false;

        Date last30Days = Date.today().addDays(-30);

        Integer suspensionCount = [
            SELECT COUNT()
            FROM Suspension__c
            WHERE Contact__c = :contactId
            AND Location__c = :location
            AND (
                (CreatedDate >= :last30Days AND Type__c != 'Warning' AND Reinstated__c = false)
                OR Type__c = 'Permanent'
                OR (Type__c = '30 Day - Age 64 and Below' AND Reinstated__c = false)
            )
        ];

        return suspensionCount > 0;
    }

    // ---------------------------------------------------------------------
    // Scanned Contact list methods
    // ---------------------------------------------------------------------
    @AuraEnabled
    public static void createScannedContact(Id contactId, String eventType) {
        if (contactId == null || String.isBlank(eventType)) {
            throw new AuraHandledException('Missing contact or event type for scanned contact.');
        }

        Contact c = getContactOrThrow(contactId);
        String uniqueKey = String.valueOf(contactId) + '-' + eventType;

        List<Scanned_Contact__c> existing = [
            SELECT Id
            FROM Scanned_Contact__c
            WHERE Unique_Key__c = :uniqueKey
            LIMIT 1
        ];

        if (!existing.isEmpty()) {
            return;
        }

        try {
            insert new Scanned_Contact__c(
                Contact_ID__c = contactId,
                Contact_Name__c = c.Name,
                Event_Type__c = eventType,
                Unique_Key__c = uniqueKey
            );
        } catch (DmlException e) {
            if (e.getDmlType(0) != StatusCode.DUPLICATE_VALUE) {
                throw new AuraHandledException('Could not add this contact to the scanned contact list: ' + safeMessage(e));
            }
        }
    }

    @AuraEnabled
    public static void deleteScannedContact(Id contactId, String eventType) {
        if (contactId == null || String.isBlank(eventType)) return;

        List<Scanned_Contact__c> matches = [
            SELECT Id
            FROM Scanned_Contact__c
            WHERE Contact_ID__c = :contactId
            AND Event_Type__c = :eventType
        ];

        if (!matches.isEmpty()) {
            delete matches;
        }
    }

    // ---------------------------------------------------------------------
    // Assistance creation/update methods
    // ---------------------------------------------------------------------
    @AuraEnabled
    public static c4g_Client_Assistance__c createFoodAssistance(Id contactId, Id recordTypeId, String typeOfAssistance, Integer pounds) {
        requireContactId(contactId);
        requireRecordTypeId(recordTypeId);

        if (String.isBlank(typeOfAssistance)) {
            throw new AuraHandledException('Type of assistance is required.');
        }
        if (pounds == null || pounds <= 0) {
            throw new AuraHandledException('Food Pantry pounds must be greater than zero.');
        }

        c4g_Client_Service__c service = getLatestClientServiceOrThrow(contactId, FOOD_SERVICE_RECORD_TYPE_ID, 'Food Pantry');

        c4g_Client_Assistance__c assistance = new c4g_Client_Assistance__c(
            c4g_Client__c = contactId,
            c4g_Client_Service__c = service.Id,
            Case__c = service.c4g_Case__c,
            RecordTypeId = recordTypeId,
            Type_of_Food_Assistance__c = typeOfAssistance,
            Date_of_Assistance__c = Date.today(),
            Food_Pantry_Pounds_of_Food_Distributed__c = pounds
        );

        insert assistance;
        return assistance;
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c createCaresCenterAssistance(Id contactId, Id recordTypeId, Decimal amountSpent) {
        requireContactId(contactId);
        requireRecordTypeId(recordTypeId);

        Decimal safeAmount = amountSpent == null ? 0 : amountSpent;

        List<c4g_Client_Assistance__c> existingToday = [
            SELECT Id, ACO_Cares_Account_Amount_Spent__c
            FROM c4g_Client_Assistance__c
            WHERE c4g_Client__c = :contactId
            AND RecordTypeId = :recordTypeId
            AND Date_of_Assistance__c = TODAY
            LIMIT 1
        ];

        if (!existingToday.isEmpty()) {
            c4g_Client_Assistance__c existingAssistance = existingToday[0];
            existingAssistance.ACO_Cares_Account_Amount_Spent__c = safeAmount;
            update existingAssistance;
            return existingAssistance;
        }

        c4g_Client_Service__c service = getLatestClientServiceOrThrow(contactId, CARES_SERVICE_RECORD_TYPE_ID, 'Cares Center');

        c4g_Client_Assistance__c assistance = new c4g_Client_Assistance__c(
            c4g_Client__c = contactId,
            c4g_Client_Service__c = service.Id,
            Case__c = service.c4g_Case__c,
            RecordTypeId = recordTypeId,
            ACO_Cares_Account_Amount_Spent__c = safeAmount,
            Date_of_Assistance__c = Date.today()
        );

        insert assistance;
        return assistance;
    }

    @AuraEnabled
    public static Cares_Center_Item__c createCaresCenterItem(Id contactId, String itemName) {
        requireContactId(contactId);
        if (String.isBlank(itemName)) {
            throw new AuraHandledException('Cares Center item name is required.');
        }

        c4g_Client_Assistance__c assistance = getLatestAssistanceOrThrow(contactId, CARES_VISIT_ASSISTANCE_RECORD_TYPE_ID, 'Cares Center Visit');

        Cares_Center_Item__c item = new Cares_Center_Item__c(
            Name = itemName,
            Date_Item_was_Received__c = Date.today(),
            Assistance__c = assistance.Id,
            Contact__c = contactId
        );

        insert item;
        return item;
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c updateNorthPoleAssistance(Id contactId) {
        c4g_Client_Assistance__c assistance = getLatestAssistanceOrThrow(contactId, NORTH_POLE_ASSISTANCE_RECORD_TYPE_ID, 'Holiday Gift Distribution');
        assistance.Client_Picked_Up_Toys__c = true;
        update assistance;
        return assistance;
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c updateSchoolSuppliesAssistance(Id contactId) {
        c4g_Client_Assistance__c assistance = getLatestAssistanceOrThrow(contactId, SCHOOL_SUPPLIES_ASSISTANCE_RECORD_TYPE_ID, 'Back to School Distribution');
        assistance.Client_Picked_Up_School_Supplies__c = true;
        update assistance;
        return assistance;
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c updateSeminarAssistance(Id contactId, String typeOfSeminar, String seminarName) {
        requireContactId(contactId);

        List<c4g_Client_Assistance__c> records = [
            SELECT Id, Seminar__c, Seminar_Attended__c
            FROM c4g_Client_Assistance__c
            WHERE c4g_Client__c = :contactId
            AND RecordTypeId = :SEMINAR_ASSISTANCE_RECORD_TYPE_ID
            AND Seminar_Attended__c = null
            ORDER BY Date_of_Assistance__c DESC, CreatedDate DESC
            LIMIT 1
        ];

        if (records.isEmpty()) {
            throw new AuraHandledException('No open Learning Academy/Seminar Assistance record was found for this contact.');
        }

        c4g_Client_Assistance__c assistance = records[0];
        assistance.Seminar__c = typeOfSeminar;
        assistance.Seminar_Attended__c = seminarName;
        update assistance;
        return assistance;
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c updateSpecialEventBalance(Id contactId, Id recordTypeId, Decimal amount) {
        requireContactId(contactId);
        requireRecordTypeId(recordTypeId);

        Decimal safeAmount = amount == null ? 0 : amount;

        List<c4g_Client_Assistance__c> records = [
            SELECT Id, Special_Event_Balance__c
            FROM c4g_Client_Assistance__c
            WHERE c4g_Client__c = :contactId
            AND RecordTypeId = :recordTypeId
            ORDER BY Date_of_Assistance__c DESC, CreatedDate DESC
            LIMIT 1
        ];

        if (records.isEmpty()) {
            throw new AuraHandledException('No matching special event Assistance record was found for this contact.');
        }

        c4g_Client_Assistance__c assistance = records[0];
        Decimal currentBalance = assistance.Special_Event_Balance__c == null ? 0 : assistance.Special_Event_Balance__c;
        assistance.Special_Event_Balance__c = currentBalance - safeAmount;
        update assistance;
        return assistance;
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c updateCaresCardBalance(Id contactId, Decimal amount) {
        requireContactId(contactId);
        Decimal safeAmount = amount == null ? 0 : amount;

        List<c4g_Client_Assistance__c> clientBalances = [
            SELECT Id, ACO_Cares_Card__c
            FROM c4g_Client_Assistance__c
            WHERE c4g_Client__c = :contactId
            AND RecordTypeId = :CARES_ACCOUNT_RECORD_TYPE_ID
            ORDER BY Date_of_Assistance__c DESC, CreatedDate DESC
            LIMIT 1
        ];

        if (clientBalances.isEmpty()) {
            throw new AuraHandledException('No Cares Card balance record was found for this contact. Please create or verify the Cares Card balance before checkout.');
        }

        c4g_Client_Assistance__c clientBalance = clientBalances[0];
        Decimal currentClientBalance = clientBalance.ACO_Cares_Card__c == null ? 0 : clientBalance.ACO_Cares_Card__c;
        clientBalance.ACO_Cares_Card__c = currentClientBalance - safeAmount;

        List<c4g_Client_Assistance__c> houseBalances = [
            SELECT Id, ACO_Cares_Card__c
            FROM c4g_Client_Assistance__c
            WHERE c4g_Client__c = :CARES_AMOUNT_SPENT_TRACKER_CONTACT_ID
            AND RecordTypeId = :CARES_ACCOUNT_RECORD_TYPE_ID
            ORDER BY Date_of_Assistance__c DESC, CreatedDate DESC
            LIMIT 1
        ];

        List<c4g_Client_Assistance__c> recordsToUpdate = new List<c4g_Client_Assistance__c>{ clientBalance };

        // Original code updated this second record too. This refactor keeps that behavior
        // when the record exists, but it will no longer crash checkout if it is missing.
        if (!houseBalances.isEmpty()) {
            c4g_Client_Assistance__c houseBalance = houseBalances[0];
            Decimal currentHouseBalance = houseBalance.ACO_Cares_Card__c == null ? 0 : houseBalance.ACO_Cares_Card__c;
            houseBalance.ACO_Cares_Card__c = currentHouseBalance + safeAmount;
            recordsToUpdate.add(houseBalance);
        }

        update recordsToUpdate;
        return clientBalance;
    }
}