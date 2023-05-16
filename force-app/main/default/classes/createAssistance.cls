public with sharing class createAssistance {
    @AuraEnabled(cacheable=true)
    public static List<c4g_Client_Assistance__c> checkDate(Id contactId, Id recordTypeId){
        return [SELECT Date_of_Assistance__c FROM c4g_Client_Assistance__c WHERE c4g_Client__c = :contactId AND RecordTypeId = :recordTypeId ORDER BY Date_of_Assistance__c DESC LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<c4g_Client_Assistance__c> getNumberKids(Id contactId, Id recordTypeId){
        return [SELECT of_Children_Receiving_Toys__c FROM c4g_Client_Assistance__c WHERE c4g_Client__c = :contactId AND RecordTypeId = :recordTypeId ORDER BY Date_of_Assistance__c DESC LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static List<c4g_Client_Assistance__c> getNumberBackpacks(Id contactId, Id recordTypeId){
        return [SELECT of_Backpack_with_School_Supplies_Given__c FROM c4g_Client_Assistance__c WHERE c4g_Client__c = :contactId AND RecordTypeId = :recordTypeId ORDER BY Date_of_Assistance__c DESC LIMIT 1];
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c createAssistance(Id contactId, Id recordTypeId, String typeOfAssistance, Integer pounds){
        c4g_Client_Service__c queriedService = [SELECT Id, c4g_Case__c FROM c4g_Client_Service__c WHERE c4g_Client__c = :contactId AND RecordTypeId = '012390000006CWdAAM' ORDER BY CreatedDate DESC LIMIT 1];
        Id serviceId = queriedService.Id;
        Id serviceCaseId = queriedService.c4g_Case__c;
        c4g_Client_Assistance__c assistance = new c4g_Client_Assistance__c(c4g_Client__c = contactId, c4g_Client_Service__c = serviceId, Case__c = serviceCaseId, RecordTypeId = recordTypeId, Type_of_Food_Assistance__c = typeOfAssistance, Date_of_Assistance__c = date.today(), Food_Pantry_Pounds_of_Food_Distributed__c = pounds);
        insert assistance;
        return assistance;
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c updateNorthPoleAssistance(Id contactId, Boolean receivedBike){
        c4g_Client_Assistance__c queriedAssistance = [SELECT Client_Picked_Up_Toys__c FROM c4g_Client_Assistance__c WHERE c4g_Client__c = :contactId AND RecordTypeId = '012390000006CFBAA2' ORDER BY Date_of_Assistance__c DESC LIMIT 1];
        queriedAssistance.Client_Picked_Up_Toys__c = true;
        if (receivedBike == true) {
            queriedAssistance.Year_Client_Received_Bike__C = Date.Today().Year();
        }
        update queriedAssistance;
        return queriedAssistance;
    }

    @AuraEnabled
    public static c4g_Client_Assistance__c updateSchoolSuppliesAssistance(Id contactId){
        c4g_Client_Assistance__c queriedAssistance = [SELECT Client_Picked_Up_School_Supplies__c FROM c4g_Client_Assistance__c WHERE c4g_Client__c = :contactId AND RecordTypeId = '012390000006CF1AAM' ORDER BY Date_of_Assistance__c DESC LIMIT 1];
        queriedAssistance.Client_Picked_Up_School_Supplies__c = true;
        update queriedAssistance;
        return queriedAssistance;
    }
}