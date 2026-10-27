import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const db=new PrismaClient();
async function main(){
 const p=await db.patient.upsert({where:{cpf:'52998224725'},update:{},create:{name:'Ana Souza (fictícia)',cpf:'52998224725',birthDate:new Date('1990-05-12'),sex:'Feminino',phone:'(11) 90000-0000',address:'Rua das Flores, 100 — São Paulo/SP'}});
 if(!(await db.triage.findFirst({where:{patientId:p.id}}))){const t=await db.triage.create({data:{patientId:p.id,symptoms:'Dor de cabeça leve',observations:'Registro fictício para demonstração',risk:'POUCO_URGENTE'}});await db.encounter.create({data:{triageId:t.id}});}
 console.log('Carga fictícia concluída.');
}
main().finally(()=>db.$disconnect());
