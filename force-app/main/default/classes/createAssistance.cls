public with sharing class createAssistance {
    @AuraEnabled(cacheable=true)
    public static List<c4g_Client_Assistance__c> checkDate(Id contactId, Id recordTypeId) {
        return [SELECT Date_of_Assistance__c,Eligible_for_Food_Pantry_Shopping__c
                FROM c4g_Client_Assistance__c
                WHERE c4g_Client__c = :contactId 
                AND RecordTypeId = :recordTypeId
                ORDER BY Date_of_Assistance__c
                DESC LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<Case> getKidsForSummerFood(Id contactId) {
        return [SELECT Children_in_Your_Home_0_17__c
                FROM Case
                WHERE ContactId = :contactId
                ORDER BY Date_Created__c
                DESC LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<Case> getTotalNumberInHousehold(Id contactId) {
        return [SELECT Total_Number_in_Household__c
                FROM Case
                WHERE ContactId = :contactId
                ORDER BY Date_Created__c
                DESC LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<c4g_Client_Assistance__c> getNumberKids(Id contactId, Id recordTypeId) {
        return [SELECT of_Children_Receiving_Toys__c
                FROM c4g_Client_Assistance__c
                WHERE c4g_Client__c = :contactId
                AND RecordTypeId = :recordTypeId
                ORDER BY Date_of_Assistance__c
                DESC LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<Holiday__c> getChildInfo(Id contactId, String campaignName) {
        return [SELECT Child_Name__c,Child_Age__c,Gender__C
                FROM Holiday__c
                WHERE Contact__c = :contactId
                AND Campaign_Name__c = :campaignName
                ORDER BY Child_Age__c
                DESC];
    }

    @AuraEnabled(cacheable=true)
    public static List<c4g_Client_Assistance__c> getNumberBackpacks(Id contactId, Id recordTypeId) {
        return [SELECT of_Backpack_with_School_Supplies_Given__c
                FROM c4g_Client_Assistance__c
                WHERE c4g_Client__c = :contactId
                AND RecordTypeId = :recordTypeId
                ORDER BY Date_of_Assistance__c
                DESC LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<c4g_Client_Assistance__c> getSpecialEventBalance(Id contactId, Id recordTypeId) {
        return [SELECT Special_Event_Balance__c
                FROM c4g_Client_Assistance__c
                WHERE c4g_Client__c = :contactId
                AND RecordTypeId = :recordTypeId
                ORDER BY Date_of_Assistance__c
                DESC LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<c4g_Client_Assistance__c> getNoShowStatus(Id contactId, Id recordTypeId) {
        return [SELECT No_Show_Formula_for_Scanner__c
                FROM c4g_Client_Assistance__c
                WHERE c4g_Client__c = :contactId
                AND RecordTypeId = :recordTypeId
                ORDER BY Date_of_Assistance__c
                DESC LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<c4g_Client_Assistance__c> getCaresCenterDates(Id contactId, Id recordTypeId) {
        // Get the current month and year
        Integer currentMonth = Date.today().month();
        Integer currentYear = Date.today().year();
    
        // Calculate the start and end dates of the current month
        Date startDate = Date.newInstance(currentYear, currentMonth, 1);
        Date endDate = startDate.addMonths(1).addDays(-1);
    
        // Query for the number of assistances in the current month
        Integer assistancesCount = [SELECT COUNT()
                                    FROM c4g_Client_Assistance__c
                                    WHERE c4g_Client__c = :contactId
                                    AND RecordTypeId = :recordTypeId
                                    AND Date_of_Assistance__c >= :startDate
                                    AND Date_of_Assistance__c <= :endDate];
    
        // Query for the assistances with the calculated limit
        return [SELECT Date_of_Assistance__c,No_Show_Formula_for_Scanner__c
                FROM c4g_Client_Assistance__c
                WHERE c4g_Client__c = :contactId 
                AND RecordTypeId = :recordTypeId
                AND Date_of_Assistance__c >= :startDate
                AND Date_of_Assistance__c <= :endDate
                ORDER BY Date_of_Assistance__c
                DESC LIMIT :assistancesCount];
    }

    @AuraEnabled(cacheable=true)
    public static List<Cares_Center_Item__c> getLaundryDetergent(Id contactId) {
        return [SELECT Name,Date_Item_was_Received__c,Eligible_for_Item__c
                FROM Cares_Center_Item__c
                WHERE Contact__c = :contactId
                AND Name = 'Laundry Detergent'
                ORDER BY Date_Item_was_Received__c
                DESC LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<Cares_Center_Item__c> getPaperTowel(Id contactId) {
        return [SELECT Name,Date_Item_was_Received__c,Eligible_for_Item__c
                FROM Cares_Center_Item__c
                WHERE Contact__c = :contactId
                AND Name = 'Paper Towel'
                ORDER BY Date_Item_was_Received__c
                DESC LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<Cares_Center_Item__c> getToiletPaper(Id contactId) {
        return [SELECT Name,Date_Item_was_Received__c,Eligible_for_Item__c
                FROM Cares_Center_Item__c
                WHERE Contact__c = :contactId
                AND Name = 'Toilet Paper'
                ORDER BY Date_Item_was_Received__c
                DESC LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<c4g_Client_Assistance__c> getCaresCardBalance(Id contactId) {
        return [SELECT ACO_Cares_Card__c
                FROM c4g_Client_Assistance__c
                WHERE c4g_Client__c = :contactId
                AND RecordTypeId = '0124z000000xUcgAAE'
                ORDER BY Date_of_Assistance__c
                DESC LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<Event> getAppointmentDateTime(Id contactId, String subject) {
        String likeClause = '%' + subject + '%';

        return [SELECT Event_Start_Date_Time_as_Text__c
                FROM Event
                WHERE WhoId = :contactId
                AND Subject LIKE :likeClause
                ORDER BY Event_Start_Date_Time_as_Text__c
                DESC];
    }

    @AuraEnabled(cacheable=true)
    public static Boolean isContactSuspended(Id contactId, String location) {
        Date today = Date.today();
        Date last30Days = today.addDays(-30);

        Integer suspensionCount = [
            SELECT COUNT()
            FROM Suspension__c
            WHERE Contact__c = :contactId
            AND Location__c = :location
            AND (CreatedDate >= :last30Days OR Permanent_Suspension__c = true)
        ];

        return suspensionCount > 0;
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c createFoodAssistance(Id contactId, Id recordTypeId, String typeOfAssistance, Integer pounds) {
        c4g_Client_Service__c queriedService = [SELECT Id, c4g_Case__c
                                                FROM c4g_Client_Service__c
                                                WHERE c4g_Client__c = :contactId
                                                AND RecordTypeId = '012390000006CWdAAM'
                                                ORDER BY CreatedDate
                                                DESC LIMIT 1];

        Id serviceId = queriedService.Id;
        Id serviceCaseId = queriedService.c4g_Case__c;

        c4g_Client_Assistance__c assistance = new c4g_Client_Assistance__c(
            c4g_Client__c = contactId,
            c4g_Client_Service__c = serviceId,
            Case__c = serviceCaseId,
            RecordTypeId = recordTypeId,
            Type_of_Food_Assistance__c = typeOfAssistance,
            Date_of_Assistance__c = date.today(),
            Food_Pantry_Pounds_of_Food_Distributed__c = pounds);

        insert assistance;
        return assistance;
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c createCaresCenterAssistance(Id contactId, Id recordTypeId, Decimal amountSpent) {
        List<c4g_Client_Assistance__c> assistanceList = [SELECT Id,ACO_Cares_Account_Amount_Spent__c
                                                              FROM c4g_Client_Assistance__c
                                                              WHERE c4g_Client__c = :contactId
                                                              AND RecordTypeId = :recordTypeId
                                                              AND Date_of_Assistance__c = TODAY
                                                              LIMIT 1];

        if (!assistanceList.isEmpty()) {
            c4g_Client_Assistance__c existingAssistance = assistanceList[0];
            existingAssistance.ACO_Cares_Account_Amount_Spent__c = amountSpent;

            update existingAssistance;
            return existingAssistance;
        } else {
            c4g_Client_Service__c queriedService = [SELECT Id, c4g_Case__c
                                                    FROM c4g_Client_Service__c
                                                    WHERE c4g_Client__c = :contactId
                                                    AND RecordTypeId = '01239000000AmBwAAK'
                                                    ORDER BY CreatedDate
                                                    DESC LIMIT 1];

            Id serviceId = queriedService.Id;
            Id serviceCaseId = queriedService.c4g_Case__c;
            
            c4g_Client_Assistance__c assistance = new c4g_Client_Assistance__c(
                c4g_Client__c = contactId,
                c4g_Client_Service__c = serviceId,
                Case__c = serviceCaseId,
                RecordTypeId = recordTypeId,
                ACO_Cares_Account_Amount_Spent__c = amountSpent,
                Date_of_Assistance__c = date.today());

            insert assistance;
            return assistance;
        }
    }

    @AuraEnabled
    public static Cares_Center_Item__c createCaresCenterItem(Id contactId, String itemName) {
        c4g_Client_Assistance__c queriedAssistance = [SELECT Id
                                                      FROM c4g_Client_Assistance__c
                                                      WHERE c4g_Client__c = :contactId
                                                      AND RecordTypeId = '012Nt000000plo5IAA'
                                                      ORDER BY Date_of_Assistance__c
                                                      DESC LIMIT 1];

        Id assistanceId = queriedAssistance.Id;
        
        Cares_Center_Item__c caresCenterItem = new Cares_Center_Item__c(
            Name = itemName,
            Date_Item_was_Received__c = date.today(),
            Assistance__c = assistanceId,
            Contact__c = contactId);

        insert caresCenterItem;
        return caresCenterItem;
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c updateNorthPoleAssistance(Id contactId) {
        c4g_Client_Assistance__c queriedAssistance = [SELECT Client_Picked_Up_Toys__c
                                                      FROM c4g_Client_Assistance__c
                                                      WHERE c4g_Client__c = :contactId
                                                      AND RecordTypeId = '012390000006CFBAA2'
                                                      ORDER BY Date_of_Assistance__c
                                                      DESC LIMIT 1];

        queriedAssistance.Client_Picked_Up_Toys__c = true;

        update queriedAssistance;
        return queriedAssistance;
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c updateSchoolSuppliesAssistance(Id contactId) {
        c4g_Client_Assistance__c queriedAssistance = [SELECT Client_Picked_Up_School_Supplies__c
                                                      FROM c4g_Client_Assistance__c
                                                      WHERE c4g_Client__c = :contactId
                                                      AND RecordTypeId = '012390000006CF1AAM'
                                                      ORDER BY Date_of_Assistance__c
                                                      DESC LIMIT 1];

        queriedAssistance.Client_Picked_Up_School_Supplies__c = true;
        
        update queriedAssistance;
        return queriedAssistance;
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c updateSeminarAssistance(Id contactId, String typeOfWorkshop, String workshopName) {
        c4g_Client_Assistance__c queriedAssistance = [SELECT Seminar__c, Seminar_Attended__c
                                                      FROM c4g_Client_Assistance__c
                                                      WHERE c4g_Client__c = :contactId
                                                      AND RecordTypeId = '0124z000000xUd0AAE'
                                                      AND Seminar_Attended__c = null
                                                      ORDER BY Date_of_Assistance__c
                                                      DESC LIMIT 1];

        queriedAssistance.Seminar__c = typeOfWorkshop;
        queriedAssistance.Seminar_Attended__c = workshopName;
        
        update queriedAssistance;
        return queriedAssistance;
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c updateSpecialEventBalance(Id contactId, Id recordTypeId, Decimal amount) {
        c4g_Client_Assistance__c queriedAssistance = [SELECT Special_Event_Balance__c
                                                      FROM c4g_Client_Assistance__c
                                                      WHERE c4g_Client__c = :contactId
                                                      AND RecordTypeId = :recordTypeId
                                                      ORDER BY Date_of_Assistance__c
                                                      DESC LIMIT 1];

        queriedAssistance.Special_Event_Balance__c -= amount;

        update queriedAssistance;
        return queriedAssistance;
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c updateCaresCardBalance(Id contactId, Decimal amount) {
        c4g_Client_Assistance__c queriedAssistance = [SELECT ACO_Cares_Card__c
                                                      FROM c4g_Client_Assistance__c
                                                      WHERE c4g_Client__c = :contactId
                                                      AND RecordTypeId = '0124z000000xUcgAAE'
                                                      ORDER BY Date_of_Assistance__c
                                                      DESC LIMIT 1];

        queriedAssistance.ACO_Cares_Card__c -= amount;

        update queriedAssistance;

        c4g_Client_Assistance__c queriedAssistance2 = [SELECT ACO_Cares_Card__c
                                                       FROM c4g_Client_Assistance__c
                                                       WHERE c4g_Client__c = '003Nt00000DrKHKIA3'
                                                       AND RecordTypeId = '0124z000000xUcgAAE'
                                                       ORDER BY Date_of_Assistance__c
                                                       DESC LIMIT 1];

        queriedAssistance2.ACO_Cares_Card__c += amount;
        
        update queriedAssistance2;

        return queriedAssistance;
    }
}