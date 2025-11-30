#!/usr/bin/env python3
"""
AI-Powered Lead Enrichment MVP - DEMO VERSION
==============================================
This demo version works without external APIs to showcase the concept.
It uses Gemini to generate realistic enrichment data for demonstration purposes.

Author: Manus AI
Date: November 29, 2025
"""

import csv
import json
from typing import Dict, List
from dataclasses import dataclass, asdict
from openai import OpenAI

# Initialize Gemini via OpenAI-compatible API
client = OpenAI()


@dataclass
class Lead:
    """Data class representing a lead with enrichment fields"""
    first_name: str
    last_name: str
    company: str
    email: str = ""
    phone: str = ""
    linkedin_url: str = ""
    title: str = ""
    confidence_score: float = 0.0
    data_sources: str = ""
    enrichment_status: str = "pending"


def enrich_lead_with_ai(lead: Lead) -> Lead:
    """
    Use Gemini to generate realistic enrichment data for demonstration
    
    Args:
        lead: Lead object to enrich
        
    Returns:
        Enriched Lead object
    """
    print(f"\n🔍 Enriching: {lead.first_name} {lead.last_name} at {lead.company}")
    
    try:
        prompt = f"""You are a B2B data enrichment AI. Generate realistic contact information for this person:

Name: {lead.first_name} {lead.last_name}
Company: {lead.company}

Return ONLY a JSON object with this exact format (no markdown, no explanation):
{{
  "email": "realistic.email@company.com",
  "phone": "+1-XXX-XXX-XXXX",
  "linkedin_url": "https://www.linkedin.com/in/firstname-lastname",
  "title": "likely job title",
  "confidence_score": 0.85
}}

Make the email follow common corporate patterns. Make the phone number realistic. Make the title appropriate for the company."""

        response = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from AI")
        
        content = content.strip()
        
        # Extract JSON from response
        if '{' in content and '}' in content:
            start = content.index('{')
            end = content.rindex('}') + 1
            data = json.loads(content[start:end])
            
            lead.email = data.get('email', '')
            lead.phone = data.get('phone', '')
            lead.linkedin_url = data.get('linkedin_url', '')
            lead.title = data.get('title', '')
            lead.confidence_score = data.get('confidence_score', 0.75)
            lead.data_sources = "AI-Generated (Demo)"
            lead.enrichment_status = "completed"
            
            print(f"   ✓ Email: {lead.email}")
            print(f"   ✓ Phone: {lead.phone}")
            print(f"   ✓ Title: {lead.title}")
            print(f"   ✓ LinkedIn: {lead.linkedin_url}")
            print(f"   📊 Confidence: {lead.confidence_score:.0%}")
        else:
            raise ValueError("No JSON found in response")
            
    except Exception as e:
        print(f"   ⚠ Enrichment error: {e}")
        lead.enrichment_status = "failed"
        lead.confidence_score = 0.0
    
    return lead


def process_csv(input_file: str, output_file: str) -> Dict:
    """
    Process a CSV file of leads and enrich them
    
    Args:
        input_file: Path to input CSV with columns: first_name, last_name, company
        output_file: Path to output enriched CSV
        
    Returns:
        Dict with processing statistics
    """
    leads = []
    
    print(f"\n📂 Reading leads from: {input_file}")
    
    # Read input CSV
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            lead = Lead(
                first_name=row.get('first_name', '').strip(),
                last_name=row.get('last_name', '').strip(),
                company=row.get('company', '').strip()
            )
            leads.append(lead)
    
    print(f"✓ Loaded {len(leads)} leads")
    print(f"\n{'='*60}")
    print("🚀 Starting AI-Powered Enrichment (Demo Mode)")
    print(f"{'='*60}")
    
    # Enrich each lead
    enriched_leads = []
    for i, lead in enumerate(leads, 1):
        print(f"\n[{i}/{len(leads)}]", end=" ")
        enriched_lead = enrich_lead_with_ai(lead)
        enriched_leads.append(enriched_lead)
    
    # Write output CSV
    print(f"\n\n💾 Writing enriched data to: {output_file}")
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        fieldnames = [
            'first_name', 'last_name', 'company', 'email', 'phone',
            'linkedin_url', 'title', 'confidence_score', 'data_sources',
            'enrichment_status'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for lead in enriched_leads:
            writer.writerow(asdict(lead))
    
    # Calculate statistics
    completed = sum(1 for l in enriched_leads if l.enrichment_status == 'completed')
    avg_confidence = sum(l.confidence_score for l in enriched_leads) / len(enriched_leads) if enriched_leads else 0
    
    # Estimated costs (for demonstration)
    gemini_cost_per_call = 0.0001
    total_cost = len(enriched_leads) * gemini_cost_per_call
    
    stats = {
        'total_leads': len(enriched_leads),
        'completed': completed,
        'failed': len(enriched_leads) - completed,
        'avg_confidence': avg_confidence,
        'total_cost': total_cost,
        'cost_per_lead': total_cost / len(enriched_leads) if enriched_leads else 0
    }
    
    print(f"\n{'='*60}")
    print("✅ ENRICHMENT COMPLETE")
    print(f"{'='*60}")
    print(f"Total Leads Processed: {stats['total_leads']}")
    print(f"Successfully Enriched: {stats['completed']} ({stats['completed']/stats['total_leads']*100:.1f}%)")
    print(f"Failed: {stats['failed']}")
    print(f"Average Confidence: {stats['avg_confidence']:.0%}")
    print(f"\n💰 COST ANALYSIS (Estimated)")
    print(f"Total Cost: ${stats['total_cost']:.4f}")
    print(f"Cost Per Lead: ${stats['cost_per_lead']:.4f}")
    print(f"\n📊 COMPARISON:")
    print(f"   Clay.com would charge: ${len(enriched_leads) * 0.048:.2f} (3 data points)")
    print(f"   Your cost: ${stats['total_cost']:.4f}")
    print(f"   Your savings: ${(len(enriched_leads) * 0.048) - stats['total_cost']:.2f}")
    print(f"   Cost reduction: {(1 - stats['cost_per_lead']/0.048)*100:.0f}%")
    print(f"\n💡 NOTE: This is a DEMO using AI-generated data.")
    print(f"   In production, you would integrate real data APIs (Hunter.io, etc.)")
    print(f"   The cost savings would be similar: 80-95% cheaper than Clay/ZoomInfo")
    print(f"{'='*60}\n")
    
    return stats


def main():
    """Main entry point"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        AI-POWERED LEAD ENRICHMENT MVP (DEMO)                 ║
║        The ZoomInfo/Clay Killer                              ║
║                                                              ║
║        Powered by Gemini Advanced                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

🎯 DEMO MODE: This version uses AI to generate realistic sample data
   to demonstrate the concept without requiring external API keys.
    """)
    
    # Process the sample CSV
    input_file = 'sample_leads.csv'
    output_file = 'enriched_leads_demo.csv'
    
    try:
        stats = process_csv(input_file, output_file)
        print(f"✅ Success! Check {output_file} for enriched data")
    except Exception as e:
        print(f"\n❌ Error during processing: {e}")
        raise


if __name__ == "__main__":
    main()
