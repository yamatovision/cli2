#!/usr/bin/env python3
"""
Script to analyze JavaScript files for directory structure patterns
"""
import os
import re
import json
from pathlib import Path
from collections import defaultdict

def find_directory_patterns(file_path):
    """Extract directory structure patterns from a JavaScript file"""
    patterns = {
        'file_paths': [],
        'imports': [],
        'requires': [],
        'error_messages': [],
        'source_maps': [],
        'module_names': [],
        'directory_names': set()
    }
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        # Find import statements
        import_pattern = r'import\s+(?:.*?\s+from\s+)?[\'"]([^\'"\n]+)[\'"]'
        patterns['imports'] = re.findall(import_pattern, content)
        
        # Find require statements
        require_pattern = r'require\s*\([\'"]([^\'"\)]+)[\'\"]\)'
        patterns['requires'] = re.findall(require_pattern, content)
        
        # Find file paths in strings (looking for .js, .ts, .jsx, .tsx extensions)
        file_path_pattern = r'[\'"]([^\'"\s]+\.(?:js|ts|jsx|tsx))[\'"]'
        patterns['file_paths'] = re.findall(file_path_pattern, content)
        
        # Find error messages with paths
        error_pattern = r'(?:Error|error|ERROR)[^\'\"]*[\'"]([^\'\"]*[/\\][^\'\"]+)[\'"]'
        patterns['error_messages'] = re.findall(error_pattern, content)
        
        # Find source map references
        sourcemap_pattern = r'(?:sourceMap|sourceMappingURL)[^\'\"]*[\'"]([^\'\"]+)[\'"]'
        patterns['source_maps'] = re.findall(sourcemap_pattern, content)
        
        # Find module/namespace names
        module_pattern = r'(?:module\.exports|export\s+(?:default\s+)?(?:class|function|const|let|var))\s+(\w+)'
        patterns['module_names'] = re.findall(module_pattern, content)
        
        # Extract directory names from all paths
        all_paths = patterns['imports'] + patterns['requires'] + patterns['file_paths'] + patterns['error_messages']
        for path in all_paths:
            parts = path.replace('\\', '/').split('/')
            for part in parts:
                if part and not part.startswith('.') and not part.endswith('.js') and not part.endswith('.ts'):
                    patterns['directory_names'].add(part)
        
        patterns['directory_names'] = list(patterns['directory_names'])
        
    except Exception as e:
        patterns['error'] = str(e)
    
    return patterns

def analyze_directory(root_path, max_files=100):
    """Analyze JavaScript files in a directory"""
    results = {
        'analyzed_files': 0,
        'total_patterns': defaultdict(list),
        'common_directories': defaultdict(int),
        'file_analysis': {}
    }
    
    js_files = []
    for root, dirs, files in os.walk(root_path):
        # Skip node_modules
        if 'node_modules' in root:
            continue
        for file in files:
            if file.endswith(('.js', '.jsx')):
                js_files.append(os.path.join(root, file))
    
    # Analyze up to max_files
    for file_path in js_files[:max_files]:
        rel_path = os.path.relpath(file_path, root_path)
        patterns = find_directory_patterns(file_path)
        
        if any(patterns[key] for key in ['imports', 'requires', 'file_paths', 'error_messages']):
            results['file_analysis'][rel_path] = patterns
            results['analyzed_files'] += 1
            
            # Aggregate common directories
            for dir_name in patterns['directory_names']:
                results['common_directories'][dir_name] += 1
            
            # Aggregate all patterns
            for key, values in patterns.items():
                if key != 'directory_names' and isinstance(values, list):
                    results['total_patterns'][key].extend(values)
    
    # Sort common directories by frequency
    results['common_directories'] = dict(
        sorted(results['common_directories'].items(), key=lambda x: x[1], reverse=True)[:20]
    )
    
    # Get unique patterns
    for key in results['total_patterns']:
        results['total_patterns'][key] = list(set(results['total_patterns'][key]))[:50]
    
    return results

if __name__ == '__main__':
    root_path = '/Users/tatsuya/Desktop/システム開発/blc'
    results = analyze_directory(root_path)
    
    # Save results
    output_path = os.path.join(root_path, 'scripts', 'js_directory_patterns_analysis.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"Analysis complete. Results saved to: {output_path}")
    print(f"Analyzed {results['analyzed_files']} JavaScript files")
    print(f"\nTop 10 common directory names found:")
    for dir_name, count in list(results['common_directories'].items())[:10]:
        print(f"  - {dir_name}: {count} occurrences")