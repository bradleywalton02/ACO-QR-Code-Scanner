declare module "@salesforce/apex/createAssistance.getLastAssistanceDate" {
  export default function getLastAssistanceDate(param: {contactId: any, recordTypeId: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.getNumberKidsForSummerFood" {
  export default function getNumberKidsForSummerFood(param: {contactId: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.getTotalNumberInHousehold" {
  export default function getTotalNumberInHousehold(param: {contactId: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.getNumberKidsForNorthPole" {
  export default function getNumberKidsForNorthPole(param: {contactId: any, recordTypeId: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.getNorthPoleChildInfo" {
  export default function getNorthPoleChildInfo(param: {contactId: any, campaignName: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.getNumberBackpacks" {
  export default function getNumberBackpacks(param: {contactId: any, recordTypeId: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.getSchoolSuppliesChildInfo" {
  export default function getSchoolSuppliesChildInfo(param: {contactId: any, campaignName: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.getNoShowStatus" {
  export default function getNoShowStatus(param: {contactId: any, recordTypeId: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.getScannedContacts" {
  export default function getScannedContacts(param: {eventType: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.createScannedContact" {
  export default function createScannedContact(param: {contactId: any, contactName: any, eventType: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.deleteScannedContact" {
  export default function deleteScannedContact(param: {contactId: any, eventType: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.getLaundryDetergent" {
  export default function getLaundryDetergent(param: {contactId: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.getPaperTowel" {
  export default function getPaperTowel(param: {contactId: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.getToiletPaper" {
  export default function getToiletPaper(param: {contactId: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.getCaresCardBalance" {
  export default function getCaresCardBalance(param: {contactId: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.isContactSuspended" {
  export default function isContactSuspended(param: {contactId: any, location: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.createFoodAssistance" {
  export default function createFoodAssistance(param: {contactId: any, recordTypeId: any, typeOfAssistance: any, pounds: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.createCaresCenterAssistance" {
  export default function createCaresCenterAssistance(param: {contactId: any, recordTypeId: any, amountSpent: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.createCaresCenterItem" {
  export default function createCaresCenterItem(param: {contactId: any, itemName: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.updateNorthPoleAssistance" {
  export default function updateNorthPoleAssistance(param: {contactId: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.updateSchoolSuppliesAssistance" {
  export default function updateSchoolSuppliesAssistance(param: {contactId: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.updateSeminarAssistance" {
  export default function updateSeminarAssistance(param: {contactId: any, typeOfWorkshop: any, workshopName: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.updateSpecialEventBalance" {
  export default function updateSpecialEventBalance(param: {contactId: any, recordTypeId: any, amount: any}): Promise<any>;
}
declare module "@salesforce/apex/createAssistance.updateCaresCardBalance" {
  export default function updateCaresCardBalance(param: {contactId: any, amount: any}): Promise<any>;
}
