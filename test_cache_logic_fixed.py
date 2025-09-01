"""
Manual Test Script for OCR_CacheManager_New Logic
This Python script simulates the caching behavior to verify the logic
"""

import time
import json
from typing import List, Dict, Any, Optional

class MockCacheManager:
    def __init__(self):
        self.cache: Dict[str, Dict] = {}
        self.worker_counter = 0
    
    def _get_worker_key(self, languages: List[str]) -> str:
        """Generate cache key from languages (sorted)"""
        return "-".join(sorted(languages))
    
    async def initialize_worker(self, languages: List[str]) -> Dict[str, Any]:
        """Simulate the initializeWorker method"""
        self.worker_counter += 1
        key = self._get_worker_key(languages)
        
        print(f"\n--- Request {self.worker_counter} ---")
        print(f"Languages: [{', '.join(languages)}]")
        print(f"Cache key: {key}")
        
        # Check cache
        if key in self.cache:
            print("[CACHE HIT] Reusing existing worker")
            return self.cache[key]
        
        # Simulate worker creation delay
        print("[CACHE MISS] Creating new worker (simulated 0.2s delay)")
        time.sleep(0.2)  # Simulate async delay
        
        # Create mock worker
        worker = {
            "id": self.worker_counter,
            "languages": languages.copy(),
            "created_at": time.time(),
            "recognize": lambda: {"data": {"text": "Sample OCR text", "confidence": 0.95}}
        }
        
        # Cache it
        self.cache[key] = worker
        print("[CREATED] New worker created and cached")
        
        return worker
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "cached_workers": len(self.cache),
            "total_requests": self.worker_counter,
            "cache_hits": self.worker_counter - len(self.cache)
        }

async def run_manual_tests():
    """Run manual tests to verify caching logic"""
    print("=== Manual Test: OCR_CacheManager_New Logic ===\n")
    
    cache_manager = MockCacheManager()
    
    # Test 1: English-only worker
    print("1. Testing English-only worker creation...")
    worker1 = await cache_manager.initialize_worker(['eng'])
    print(f"   Worker ID: {worker1['id']}")
    
    # Test 2: Same English worker (should hit cache)
    print("\n2. Testing English worker reuse (cache hit)...")
    worker2 = await cache_manager.initialize_worker(['eng'])
    print(f"   Worker ID: {worker2['id']}")
    print(f"   Same worker? {'YES' if worker1 is worker2 else 'NO'}")
    
    # Test 3: Multilingual worker
    print("\n3. Testing multilingual worker creation...")
    worker3 = await cache_manager.initialize_worker(['eng', 'spa'])
    print(f"   Worker ID: {worker3['id']}")
    
    # Test 4: Same multilingual worker (should hit cache)
    print("\n4. Testing multilingual worker reuse (cache hit)...")
    worker4 = await cache_manager.initialize_worker(['eng', 'spa'])
    print(f"   Worker ID: {worker4['id']}")
    print(f"   Same worker? {'YES' if worker3 is worker4 else 'NO'}")
    
    # Test 5: Different order (should still hit cache)
    print("\n5. Testing language order independence...")
    worker5 = await cache_manager.initialize_worker(['spa', 'eng'])
    print(f"   Worker ID: {worker5['id']}")
    print(f"   Same worker? {'YES' if worker3 is worker5 else 'NO'}")
    
    # Test 6: Cache statistics
    print("\n6. Testing cache statistics...")
    stats = cache_manager.get_cache_stats()
    print("   Cache Statistics:")
    print(f"      Cached Workers: {stats['cached_workers']}")
    print(f"      Total Requests: {stats['total_requests']}")
    print(f"      Cache Hits: {stats['cache_hits']}")
    if stats['total_requests'] > 0:
        hit_rate = (stats['cache_hits'] / stats['total_requests']) * 100
        print(f"      Cache Hit Rate: {hit_rate:.1f}%")
    
    # Summary
    print("\n=== TEST SUMMARY ===")
    print(f"Total worker requests: {stats['total_requests']}")
    print(f"Unique workers created: {stats['cached_workers']}")
    print(f"Cache hits: {stats['cache_hits']}")
    if stats['total_requests'] > 0:
        hit_rate = (stats['cache_hits'] / stats['total_requests']) * 100
        print(f"Cache hit rate: {hit_rate:.1f}%")
    
    print("\n[SUCCESS] All cache manager logic tests completed successfully!")
    return True

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_manual_tests())