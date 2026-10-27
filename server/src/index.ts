import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient, Prisma, Risk, Status } from '@prisma/client';
import { z } from 'zod';

export const prisma = new PrismaClient();
export const app = express();
app.use(cors()); app.use(express.json());
const risks: Risk[] = ['EMERGENCIA','MUITO_URGENTE','URGENTE','POUCO_URGENTE','NAO_URGENTE'];
const cpfValid = (input: string) => {
 const cpf=input.replace(/\D/g,''); if(cpf.length!==11||/^([0-9])\1+$/.test(cpf)) return false;
 for(let len=9;len<=10;len++){let sum=0; for(let i=0;i<len;i++) sum+=Number(cpf[i])*(len+1-i); let d=(sum*10)%11; if(d===10)d=0; if(d!==Number(cpf[len]))return false;} return true;
};
const patientSchema=z.object({name:z.string().trim().min(3),cpf:z.string().refine(cpfValid,'CPF inválido'),birthDate:z.coerce.date(),sex:z.string().min(1),phone:z.string().trim().min(8),address:z.string().trim().min(5)});
const triageSchema=z.object({patientId:z.string().min(1),symptoms:z.string().trim().min(3),observations:z.string().trim().default(''),risk:z.nativeEnum(Risk)});
const auth=(req:express.Request,res:express.Response,next:express.NextFunction)=>{const token=process.env.APP_API_TOKEN;if(token&&process.env.NODE_ENV!=='test'&&req.headers.authorization!==`Bearer ${token}`)return res.status(401).json({error:'Não autorizado'});next();};
app.use('/api',auth);
app.get('/api/health',(_req,res)=>res.json({status:'ok'}));
app.get('/api/patients',async(req,res,next)=>{try{const q=String(req.query.q||'');res.json(await prisma.patient.findMany({where:q?{OR:[{name:{contains:q}},{cpf:{contains:q.replace(/\D/g,'')}}]}:{},orderBy:{name:'asc'}}));}catch(e){next(e);}});
app.post('/api/patients',async(req,res,next)=>{try{const input=patientSchema.parse(req.body);const patient=await prisma.patient.create({data:{...input,cpf:input.cpf.replace(/\D/g,'')}});res.status(201).json(patient);}catch(e){next(e);}});
app.get('/api/patients/:id',async(req,res,next)=>{try{const p=await prisma.patient.findUnique({where:{id:req.params.id}});if(!p)return res.status(404).json({error:'Paciente não encontrado'});res.json(p);}catch(e){next(e);}});
app.put('/api/patients/:id',async(req,res,next)=>{try{const input=patientSchema.parse(req.body);res.json(await prisma.patient.update({where:{id:req.params.id},data:{...input,cpf:input.cpf.replace(/\D/g,'')}}));}catch(e){next(e);}});
app.post('/api/triages',async(req,res,next)=>{try{const input=triageSchema.parse(req.body);const patient=await prisma.patient.findUnique({where:{id:input.patientId}});if(!patient)return res.status(404).json({error:'Paciente não encontrado'});const {patientId,...triageData}=input;const triage=await prisma.triage.create({data:{...triageData,patient:{connect:{id:patientId}}},include:{patient:true}});await prisma.encounter.create({data:{triageId:triage.id}});res.status(201).json(triage);}catch(e){next(e);}});
app.get('/api/triages',async(_req,res,next)=>{try{res.json(await prisma.triage.findMany({include:{patient:true,encounter:true},orderBy:{createdAt:'desc'}}));}catch(e){next(e);}});
app.get('/api/patients/:id/history',async(req,res,next)=>{try{const patient=await prisma.patient.findUnique({where:{id:req.params.id},include:{triages:{include:{encounter:true},orderBy:{createdAt:'desc'}}}});if(!patient)return res.status(404).json({error:'Paciente não encontrado'});res.json(patient);}catch(e){next(e);}});
const waitMinutes:Record<Risk,number>={EMERGENCIA:0,MUITO_URGENTE:10,URGENTE:60,POUCO_URGENTE:120,NAO_URGENTE:240};
app.get('/api/queue',async(req,res,next)=>{try{const status=req.query.status as Status|undefined;const encounters=await prisma.encounter.findMany({where:status?{status}:undefined,include:{triage:{include:{patient:true}}}});encounters.sort((a,b)=>risks.indexOf(a.triage.risk)-risks.indexOf(b.triage.risk)||a.createdAt.getTime()-b.createdAt.getTime());res.json(encounters.map(e=>({...e,estimatedWaitMinutes:waitMinutes[e.triage.risk]})));}catch(e){next(e);}});
app.patch('/api/encounters/:id/status',async(req,res,next)=>{try{const {status}=z.object({status:z.enum(['AGUARDANDO','EM_ATENDIMENTO','CONCLUIDO'])}).parse(req.body);res.json(await prisma.encounter.update({where:{id:req.params.id},data:{status}}));}catch(e){next(e);}});
app.get('/api/docs',(_req,res)=>res.json({openapi:'3.0.3',info:{title:'HealthCare Triagem API',version:'1.0.0'},servers:[{url:'/api'}],paths:{'/patients':{get:{summary:'Lista pacientes'},post:{summary:'Cadastra paciente'}},'/triages':{get:{summary:'Lista triagens'},post:{summary:'Registra triagem'}},'/queue':{get:{summary:'Fila priorizada'}},'/patients/{id}/history':{get:{summary:'Histórico clínico'}}}}));
app.use((err:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{if(err instanceof z.ZodError)return res.status(400).json({error:'Dados inválidos',details:err.issues});if(err instanceof Prisma.PrismaClientKnownRequestError){if(err.code==='P2002')return res.status(409).json({error:'CPF já cadastrado'});if(err.code==='P2025')return res.status(404).json({error:'Registro não encontrado'});}console.error(err);res.status(500).json({error:'Erro interno do servidor'});});
if(process.env.NODE_ENV!=='test'){const port=Number(process.env.PORT||3001);app.listen(port,()=>console.log(`API HealthCare em http://localhost:${port}`));}
