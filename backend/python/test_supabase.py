"""
Quick test script to verify Supabase connection
"""
import os
from supabase import create_client

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"SUPABASE_ANON_KEY: {SUPABASE_ANON_KEY[:20]}..." if SUPABASE_ANON_KEY else "SUPABASE_ANON_KEY: (empty)")

if SUPABASE_URL and SUPABASE_ANON_KEY:
    try:
        client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        print("✓ Supabase client created successfully")
        
        # Test database connection
        result = client.table("custom_templates").select("count").execute()
        print(f"✓ Database connection successful")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
else:
    print("✗ Missing environment variables")
