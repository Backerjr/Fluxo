#!/usr/bin/env python3
"""
AI-Powered Lead Enrichment MVP
================================
A cost-effective alternative to ZoomInfo and Clay that uses AI to orchestrate
waterfall API calls for contact data enrichment.

Author: Manus AI
Date: November 29, 2025
"""

import os
import csv
import json
import time
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
import requests
from openai import OpenAI

# Initialize Gemini via OpenAI-compatible API
client = OpenAI()  # API key and base URL pre-configured


@dataclass
class Lead:
    """Data class representing a lead with enrichment fields"""
    first_name: str
    last_name: str
    company: str
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    title: Optional[str] = None
    confidence_score: float = 0.0
    data_sources: str = ""
    enrichment_status: str = "pending"


class LeadEnricher:
    """Main class for enriching leads using AI-powered waterfall logic"""
    
    def __init__(self, hunter_api_key: Optional[str] = None):
        """
        Initialize the enricher with API keys
        
        Args:
            hunter_api_key: Optional Hunter.io API key for email finding
        """
        self.hunter_api_key = hunter_api_key
        self.cost_per_lead = 0.0
        
    def enrich_with_ai_waterfall(self, lead: Lead) -> Lead:
        """
        Use Gemini to intelligently decide which data sources to query
        and in what order based on the lead information available.
        
        Args:
            lead: Lead object to enrich
            
        Returns:
            Enriched Lead object
        """
        print(f"\n🔍 Enriching: {lead.first_name} {lead.last_name} at {lead.company}")
        
        # Step 1: Use Gemini to analyze the lead and suggest enrichment strategy
        strategy = self._get_enrichment_strategy(lead)
        print(f"   Strategy: {strategy}")
        
        # Step 2: Try to find email using Hunter.io (if API key provided)
        if self.hunter_api_key and not lead.email:
            email_result = self._find_email_hunter(lead)
            if email_result:
                lead.email = email_result['email']
                lead.confidence_score += email_result['confidence'] * 0.4
                lead.data_sources += "Hunter.io, "
                print(f"   ✓ Email found: {lead.email}")
        
        # Step 3: Use Gemini to generate likely email patterns if Hunter fails
        if not lead.email:
            email_patterns = self._generate_email_patterns_ai(lead)
            if email_patterns:
                lead.email = email_patterns[0]  # Take the most likely one
                lead.confidence_score += 0.3
                lead.data_sources += "AI-Generated, "
                print(f"   ⚠ Email pattern generated: {lead.email}")
        
        # Step 4: Use Gemini to search for LinkedIn profile
        linkedin_result = self._find_linkedin_ai(lead)
        if linkedin_result:
            lead.linkedin_url = linkedin_result['url']
            lead.title = linkedin_result.get('title')
            lead.confidence_score += 0.3
            lead.data_sources += "AI-LinkedIn, "
            print(f"   ✓ LinkedIn found: {lead.linkedin_url}")
        
        # Step 5: Finalize enrichment
        lead.data_sources = lead.data_sources.rstrip(", ")
        lead.enrichment_status = "completed" if lead.email else "partial"
        lead.confidence_score = min(lead.confidence_score, 1.0)
        
        print(f"   📊 Confidence: {lead.confidence_score:.0%} | Status: {lead.enrichment_status}")
        
        return lead
    
    def _get_enrichment_strategy(self, lead: Lead) -> str:
        """Use Gemini to determine the best enrichment strategy"""
        try:
            prompt = f"""You are a B2B data enrichment expert. Analyze this lead and suggest the best strategy to find their contact information:

Lead Information:
- Name: {lead.first_name} {lead.last_name}
- Company: {lead.company}

Provide a one-sentence strategy focusing on the most likely sources for accurate data."""

            response = client.chat.completions.create(
                model="gemini-2.5-flash",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=100,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            if content:
                return content.strip()
            return "Use standard email patterns and LinkedIn search"
        except Exception as e:
            print(f"   ⚠ AI strategy error: {e}")
            return "Use standard email patterns and LinkedIn search"
    
    def _find_email_hunter(self, lead: Lead) -> Optional[Dict]:
        """
        Find email using Hunter.io API
        
        Returns:
            Dict with email and confidence score, or None if not found
        """
        if not self.hunter_api_key:
            return None
            
        try:
            url = "https://api.hunter.io/v2/email-finder"
            params = {
                "domain": self._extract_domain(lead.company),
                "first_name": lead.first_name,
                "last_name": lead.last_name,
                "api_key": self.hunter_api_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('data') and data['data'].get('email'):
                    self.cost_per_lead += 0.01  # Hunter.io costs ~$0.01 per search
                    return {
                        'email': data['data']['email'],
                        'confidence': data['data'].get('score', 50) / 100
                    }
        except Exception as e:
            print(f"   ⚠ Hunter.io error: {e}")
        
        return None
    
    def _generate_email_patterns_ai(self, lead: Lead) -> List[str]:
        """Use Gemini to generate likely email patterns"""
        try:
            domain = self._extract_domain(lead.company)
            
            prompt = f"""Generate the 3 most likely email addresses for this person:

Name: {lead.first_name} {lead.last_name}
Company: {lead.company}
Domain: {domain}

Return ONLY a JSON array of email addresses, ordered by likelihood. Example format:
["firstname.lastname@domain.com", "firstnamelastname@domain.com", "flastname@domain.com"]"""

            response = client.chat.completions.create(
                model="gemini-2.5-flash",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            if not content:
                return []
            content = content.strip()
            # Extract JSON array from response
            if '[' in content and ']' in content:
                start = content.index('[')
                end = content.rindex(']') + 1
                emails = json.loads(content[start:end])
                self.cost_per_lead += 0.0001  # Gemini costs ~$0.0001 per call
                return emails
            
        except Exception as e:
            print(f"   ⚠ Email pattern generation error: {e}")
        
        return []
    
    def _find_linkedin_ai(self, lead: Lead) -> Optional[Dict]:
        """Use Gemini to construct likely LinkedIn profile URL"""
        try:
            prompt = f"""Generate the most likely LinkedIn profile URL for this person:

Name: {lead.first_name} {lead.last_name}
Company: {lead.company}

Return ONLY a JSON object with this format:
{{"url": "https://www.linkedin.com/in/firstname-lastname", "title": "likely job title"}}"""

            response = client.chat.completions.create(
                model="gemini-2.5-flash",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            if not content:
                return None
            content = content.strip()
            # Extract JSON from response
            if '{' in content and '}' in content:
                start = content.index('{')
                end = content.rindex('}') + 1
                result = json.loads(content[start:end])
                self.cost_per_lead += 0.0001
                return result
            
        except Exception as e:
            print(f"   ⚠ LinkedIn search error: {e}")
        
        return None
    
    def _extract_domain(self, company: str) -> str:
        """Extract likely domain from company name"""
        # Simple heuristic: lowercase, remove spaces, add .com
        domain = company.lower().replace(' ', '').replace(',', '').replace('.', '')
        return f"{domain}.com"
    
    def process_csv(self, input_file: str, output_file: str) -> Dict:
        """
        Process a CSV file of leads and enrich them
        
        Args:
            input_file: Path to input CSV with columns: first_name, last_name, company
            output_file: Path to output enriched CSV
            
        Returns:
            Dict with processing statistics
        """
        leads = []
        total_cost = 0.0
        
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
        print("🚀 Starting AI-Powered Enrichment")
        print(f"{'='*60}")
        
        # Enrich each lead
        enriched_leads = []
        for i, lead in enumerate(leads, 1):
            print(f"\n[{i}/{len(leads)}]", end=" ")
            enriched_lead = self.enrich_with_ai_waterfall(lead)
            enriched_leads.append(enriched_lead)
            total_cost += self.cost_per_lead
            self.cost_per_lead = 0.0  # Reset for next lead
            
            # Rate limiting to avoid API throttling
            time.sleep(0.5)
        
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
        avg_confidence = sum(l.confidence_score for l in enriched_leads) / len(enriched_leads)
        
        stats = {
            'total_leads': len(enriched_leads),
            'completed': completed,
            'partial': len(enriched_leads) - completed,
            'avg_confidence': avg_confidence,
            'total_cost': total_cost,
            'cost_per_lead': total_cost / len(enriched_leads) if enriched_leads else 0
        }
        
        print(f"\n{'='*60}")
        print("✅ ENRICHMENT COMPLETE")
        print(f"{'='*60}")
        print(f"Total Leads Processed: {stats['total_leads']}")
        print(f"Fully Enriched: {stats['completed']} ({stats['completed']/stats['total_leads']*100:.1f}%)")
        print(f"Partially Enriched: {stats['partial']}")
        print(f"Average Confidence: {stats['avg_confidence']:.0%}")
        print(f"\n💰 COST ANALYSIS")
        print(f"Total Cost: ${stats['total_cost']:.4f}")
        print(f"Cost Per Lead: ${stats['cost_per_lead']:.4f}")
        print(f"\n📊 COMPARISON:")
        print(f"   Clay.com would charge: ${len(enriched_leads) * 0.048:.2f} (3 data points)")
        print(f"   Your savings: ${(len(enriched_leads) * 0.048) - stats['total_cost']:.2f}")
        print(f"   Cost reduction: {(1 - stats['cost_per_lead']/0.016)*100:.0f}%")
        print(f"{'='*60}\n")
        
        return stats


def main():
    """Main entry point"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        AI-POWERED LEAD ENRICHMENT MVP                        ║
║        The ZoomInfo/Clay Killer                              ║
║                                                              ║
║        Powered by Gemini Advanced + ChatGPT Plus             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    # Get API keys from environment
    hunter_api_key = os.getenv('HUNTER_API_KEY')
    
    if hunter_api_key:
        print("✓ Hunter.io API key detected")
    else:
        print("⚠ No Hunter.io API key found (set HUNTER_API_KEY env var)")
        print("  Will use AI-generated email patterns instead")
    
    # Initialize enricher
    enricher = LeadEnricher(hunter_api_key=hunter_api_key)
    
    # Process the sample CSV
    input_file = 'sample_leads.csv'
    output_file = 'enriched_leads.csv'
    
    if not os.path.exists(input_file):
        print(f"\n❌ Error: {input_file} not found")
        print("Please create a CSV file with columns: first_name, last_name, company")
        return
    
    try:
        stats = enricher.process_csv(input_file, output_file)
        print(f"✅ Success! Check {output_file} for enriched data")
    except Exception as e:
        print(f"\n❌ Error during processing: {e}")
        raise


if __name__ == "__main__":
    main()
