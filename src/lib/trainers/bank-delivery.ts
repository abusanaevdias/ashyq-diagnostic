import {canRehearseBank} from './bank-navigation';
import {bankPublication,type BankPublicationManifest} from './bank-publication';
import {bankSourceIdentity,findBankSource,trainerBank,type BankSource,type BankSourceRef} from './bank-sources';
/** Public content eligibility only. It grants no LMS role, classroom access or AI access. */
export function bankDeliverySources(role:string|null|undefined,publication:BankPublicationManifest|null=bankPublication):BankSource[]{
 if(canRehearseBank(role))return trainerBank.sources;
 if(!publication)return [];
 const ids=new Set(publication.releases.map(r=>bankSourceIdentity(r.source)));
 return trainerBank.sources.filter(s=>ids.has(bankSourceIdentity(s.ref)));
}
export function canOpenBankSource(ref:BankSourceRef,role:string|null|undefined,publication:BankPublicationManifest|null=bankPublication):boolean{
 const source=findBankSource(ref);return !!source&&bankDeliverySources(role,publication).some(s=>bankSourceIdentity(s.ref)===bankSourceIdentity(source.ref));
}
