/*
 * RdLn™ - Professional Document Comparison Tool
 * Copyright (c) 2025 RdLn Team. All rights reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is proprietary to RdLn Team and may not be copied,
 * distributed, modified, or used without express written permission.
 * 
 * For licensing information, see LICENSE file.
 */

export interface SampleData {
  id: string;
  title: string;
  description: string;
  originalText: string;
  revisedText: string;
  category: 'contract' | 'legal' | 'multilingual' | 'technical' | 'academic';
  complexity: 'simple' | 'medium' | 'complex';
  changeTypes: string[]; // Types of changes showcased
}

/**
 * Curated sample data for demo purposes
 * Professional legal and contract examples with realistic revisions
 */
export const SAMPLE_DATA: SampleData[] = [
  {
    id: 'contract-termination',
    title: 'Contract Termination Clause',
    description: 'Service agreement termination terms with notice period changes',
    category: 'contract',
    complexity: 'simple',
    changeTypes: ['notice period', 'termination conditions', 'liability adjustments'],
    originalText: `TERMINATION

Either party may terminate this Agreement by providing thirty (30) days written notice to the other party. Upon termination, all outstanding obligations shall remain in effect until satisfied.

The terminating party shall be liable for all costs incurred up to the date of termination, including but not limited to professional fees and expenses.

This Agreement shall automatically terminate if either party becomes insolvent or files for bankruptcy protection.`,
    revisedText: `TERMINATION

Either party may terminate this Agreement by providing fourteen (14) days written notice to the other party. Upon termination, all outstanding obligations shall remain in effect until satisfied, except for ongoing maintenance obligations which shall continue for sixty (60) days.

The terminating party shall be liable for all reasonable costs incurred up to the date of termination, including but not limited to professional fees and documented expenses.

This Agreement shall automatically terminate if either party becomes insolvent, files for bankruptcy protection, or fails to cure a material breach within thirty (30) days of written notice.`
  },
  
  {
    id: 'liability-limitation',
    title: 'Liability Limitation Clause',
    description: 'Comprehensive liability and indemnification changes',
    category: 'legal',
    complexity: 'medium',
    changeTypes: ['liability caps', 'exclusions', 'indemnification scope'],
    originalText: `LIMITATION OF LIABILITY

In no event shall either party be liable for any indirect, incidental, special, or consequential damages arising out of this Agreement, regardless of the form of action or the theory of recovery.

The total liability of each party under this Agreement shall not exceed the total amount paid or payable hereunder in the twelve (12) months preceding the claim.

Each party agrees to indemnify and hold harmless the other party from any claims arising from their gross negligence or willful misconduct.`,
    revisedText: `LIMITATION OF LIABILITY

In no event shall either party be liable for any indirect, incidental, special, consequential, or punitive damages arising out of this Agreement, regardless of the form of action or the theory of recovery, except in cases of willful misconduct or data breaches.

The total liability of each party under this Agreement shall not exceed the greater of (i) the total amount paid or payable hereunder in the twenty-four (24) months preceding the claim, or (ii) Five Hundred Thousand Dollars ($500,000).

Each party agrees to indemnify and hold harmless the other party from any third-party claims arising from their gross negligence, willful misconduct, or breach of confidentiality obligations, including reasonable attorney fees and costs.`
  },

  {
    id: 'privacy-clause',
    title: 'Data Privacy and Security',
    description: 'GDPR-compliant privacy terms with enhanced security requirements',
    category: 'legal',
    complexity: 'complex',
    changeTypes: ['GDPR compliance', 'security standards', 'data retention'],
    originalText: `DATA PRIVACY AND SECURITY

Company shall maintain appropriate security measures to protect Customer data from unauthorized access, use, or disclosure. Customer data shall be processed in accordance with applicable privacy laws.

Data retention period shall be determined by business needs and legal requirements. Company may store data for up to seven (7) years following termination.

Customer consents to the processing of personal data as necessary for the performance of this Agreement.`,
    revisedText: `DATA PRIVACY AND SECURITY

Company shall implement and maintain industry-standard security measures, including but not limited to encryption at rest and in transit, multi-factor authentication, and regular security audits, to protect Customer data from unauthorized access, use, or disclosure. Customer data shall be processed in strict accordance with the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and other applicable privacy laws.

Data retention period shall be the minimum necessary for business and legal purposes. Company shall delete or anonymize Customer data within thirty (30) days of termination, except where longer retention is required by law or with explicit Customer consent.

Customer provides explicit consent to the processing of personal data solely as necessary for the performance of this Agreement and in accordance with Company's Privacy Policy, which may be updated from time to time with notice to Customer.

Company shall promptly notify Customer of any data breaches within seventy-two (72) hours of discovery and cooperate fully in any required breach notifications to regulatory authorities.`
  },

  {
    id: 'multilingual-contract',
    title: 'Contrato Multilingüe / Multilingual Contract',
    description: 'Bilingual contract showcasing OCR language detection capabilities',
    category: 'multilingual',
    complexity: 'medium',
    changeTypes: ['bilingual text', 'jurisdiction changes', 'translation accuracy'],
    originalText: `CONTRATO DE SERVICIOS / SERVICE AGREEMENT

Las partes acuerdan que los servicios serán prestados en español e inglés.
The parties agree that services will be provided in Spanish and English.

JURISDICCIÓN: Este contrato se regirá por las leyes de España.
JURISDICTION: This contract shall be governed by the laws of Spain.

Fecha de inicio: 1 de enero de 2025
Start date: January 1, 2025`,
    revisedText: `CONTRATO DE SERVICIOS / SERVICE AGREEMENT

Las partes acuerdan que los servicios serán prestados principalmente en español, con soporte adicional en inglés según se requiera.
The parties agree that services will be provided primarily in Spanish, with additional English support as required.

JURISDICCIÓN: Este contrato se regirá por las leyes de la Unión Europea y subsidiariamente por las leyes de España.
JURISDICTION: This contract shall be governed by the laws of the European Union and subsidiarily by the laws of Spain.

Fecha de inicio: 15 de febrero de 2025
Start date: February 15, 2025

RESOLUCIÓN DE DISPUTAS: Las disputas se resolverán mediante arbitraje en Madrid.
DISPUTE RESOLUTION: Disputes shall be resolved through arbitration in Madrid.`
  },

  {
    id: 'technical-specs',
    title: 'Technical Specifications',
    description: 'Software development requirements with detailed technical changes',
    category: 'technical',
    complexity: 'complex',
    changeTypes: ['technical requirements', 'performance metrics', 'compliance standards'],
    originalText: `TECHNICAL REQUIREMENTS

System must support minimum 1,000 concurrent users with 99.5% uptime.

Database: MySQL 8.0 or higher
Framework: React 17+ with TypeScript
Authentication: OAuth 2.0

Performance requirements:
- Page load time: < 2 seconds
- API response time: < 500ms
- File processing: < 30 seconds for documents up to 10MB

Security compliance: SOC 2 Type I certification required.`,
    revisedText: `TECHNICAL REQUIREMENTS

System must support minimum 5,000 concurrent users with 99.95% uptime and automatic failover capabilities.

Database: PostgreSQL 14+ with read replicas for scalability
Framework: React 18+ with TypeScript 4.9+, Next.js for server-side rendering
Authentication: OAuth 2.0 with SAML 2.0 support for enterprise clients

Performance requirements:
- Page load time: < 1.5 seconds with CDN optimization
- API response time: < 300ms for standard operations, < 1 second for complex queries
- File processing: < 15 seconds for documents up to 50MB with parallel processing
- Cache hit ratio: > 85% for frequently accessed data

Security compliance: SOC 2 Type II certification and ISO 27001 compliance required, with quarterly penetration testing and vulnerability assessments.

Monitoring and observability: Application Performance Monitoring (APM) with distributed tracing and real-time alerting for SLA violations.`
  }
];

/**
 * Get a random sample for quick demo purposes
 */
export const getRandomSample = (): SampleData => {
  const randomIndex = Math.floor(Math.random() * SAMPLE_DATA.length);
  return SAMPLE_DATA[randomIndex];
};

/**
 * Get samples by category
 */
export const getSamplesByCategory = (category: SampleData['category']): SampleData[] => {
  return SAMPLE_DATA.filter(sample => sample.category === category);
};

/**
 * Get samples by complexity level
 */
export const getSamplesByComplexity = (complexity: SampleData['complexity']): SampleData[] => {
  return SAMPLE_DATA.filter(sample => sample.complexity === complexity);
};

/**
 * Get the recommended sample for first-time users (simple but impactful)
 */
export const getRecommendedSample = (): SampleData => {
  return SAMPLE_DATA[0]; // Contract termination - clear, professional, easy to understand changes
};

/**
 * Get a sample that showcases specific change types
 */
export const getSampleForDemo = (demoType: 'basic' | 'multilingual' | 'complex' | 'technical'): SampleData => {
  switch (demoType) {
    case 'basic':
      return SAMPLE_DATA[0]; // Contract termination
    case 'multilingual':
      return SAMPLE_DATA[3]; // Multilingual contract
    case 'complex':
      return SAMPLE_DATA[2]; // Privacy clause
    case 'technical':
      return SAMPLE_DATA[4]; // Technical specs
    default:
      return getRecommendedSample();
  }
};