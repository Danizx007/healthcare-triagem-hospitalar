import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, prisma } from './index.js';
const cpf='52998224725';
beforeAll(async()=>{await prisma.$connect();});
beforeEach(async()=>{await prisma.encounter.deleteMany();await prisma.triage.deleteMany();await prisma.patient.deleteMany();});
afterAll(async()=>{await prisma.$disconnect();});
const patient={name:'João de Teste',cpf,birthDate:'1990-01-15',sex:'Masculino',phone:'11999999999',address:'Rua de Teste, 100'};
describe('API de triagem',()=>{
 it('cadastra, consulta paciente e rejeita CPF inválido ou duplicado',async()=>{const created=await request(app).post('/api/patients').send(patient).expect(201);await request(app).get('/api/patients').query({q:'João'}).expect(200).expect(r=>expect(r.body[0].id).toBe(created.body.id));await request(app).post('/api/patients').send(patient).expect(409);await request(app).post('/api/patients').send({...patient,cpf:'11111111111'}).expect(400);});
 it('registra triagem, ordena fila por prioridade e apresenta histórico',async()=>{const p=(await request(app).post('/api/patients').send(patient).expect(201)).body;const t=await request(app).post('/api/triages').send({patientId:p.id,symptoms:'Dor e febre',observations:'Fictício',risk:'URGENTE'}).expect(201);const q=await request(app).get('/api/queue').expect(200);expect(q.body[0].triage.id).toBe(t.body.id);expect(q.body[0].estimatedWaitMinutes).toBe(60);const h=await request(app).get(`/api/patients/${p.id}/history`).expect(200);expect(h.body.triages).toHaveLength(1);});
});
