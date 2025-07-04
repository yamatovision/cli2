#!/usr/bin/env python3
"""
Enhanced script to find directory structure patterns in JavaScript files,
including minified and bundled files
"""
import os
import re
import json
from pathlib import Path
from collections import defaultdict

def analyze_js_content(content, file_path):
    """Analyze JavaScript content for directory structure patterns"""
    findings = {
        'file_path': file_path,
        'patterns': {
            'file_extensions': [],
            'path_separators': [],
            'common_directories': [],
            'module_patterns': [],
            'error_stack_traces': [],
            'webpack_chunks': [],
            'sourcemap_refs': [],
            'namespace_patterns': []
        }
    }
    
    # File extensions pattern (.ts, .js, .tsx, .jsx, .mjs, .cjs)
    ext_pattern = r'["\']([^"\']*\.(?:ts|js|tsx|jsx|mjs|cjs|vue|svelte))["\']'
    findings['patterns']['file_extensions'] = re.findall(ext_pattern, content)[:20]
    
    # Path separator patterns (looking for directory structures)
    path_pattern = r'["\']([^"\']*(?:/|\\\\)[^"\'/\\]+(?:/|\\\\)[^"\'/\\]+)["\']'
    paths = re.findall(path_pattern, content)[:30]
    findings['patterns']['path_separators'] = paths
    
    # Common directory names
    dir_pattern = r'(?:^|["\'/\\])(?:src|lib|components|utils|helpers|services|models|views|controllers|middleware|config|test|tests|spec|specs|dist|build|assets|public|private|api|routes|pages|features|modules|packages|plugins|extensions|vendor|node_modules)(?:["\'/\\]|$)'
    findings['patterns']['common_directories'] = re.findall(dir_pattern, content, re.IGNORECASE)[:20]
    
    # Module/namespace patterns
    module_patterns = [
        r'(?:module\.exports|exports\.)(\w+)',
        r'export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)',
        r'namespace\s+(\w+)',
        r'define\(["\']([^"\']+)["\']',  # AMD modules
        r'__webpack_require__\(["\']([^"\']+)["\']',  # Webpack
    ]
    for pattern in module_patterns:
        findings['patterns']['module_patterns'].extend(re.findall(pattern, content)[:10])
    
    # Error stack traces that might reveal file paths
    stack_pattern = r'at\s+(?:\w+\s+)?\(([^)]+:\d+:\d+)\)'
    findings['patterns']['error_stack_traces'] = re.findall(stack_pattern, content)[:10]
    
    # Webpack chunk patterns
    webpack_pattern = r'webpackChunk(?:Name)?["\']?\s*[:=]\s*["\']([^"\']+)["\']'
    findings['patterns']['webpack_chunks'] = re.findall(webpack_pattern, content)[:5]
    
    # Source map references
    sourcemap_pattern = r'(?://[#@]\s*sourceMappingURL=([^\s]+)|sourceRoot["\']?\s*[:=]\s*["\']([^"\']+)["\'])'
    for match in re.findall(sourcemap_pattern, content):
        findings['patterns']['sourcemap_refs'].extend([m for m in match if m][:5])
    
    # Component/Feature naming patterns
    component_pattern = r'(?:Component|Page|View|Controller|Service|Model|Helper|Util)["\']?\s*[:=]\s*["\']([^"\']+)["\']'
    findings['patterns']['namespace_patterns'] = re.findall(component_pattern, content)[:10]
    
    return findings

def find_large_js_files(root_path, min_size_kb=50):
    """Find JavaScript files larger than min_size_kb"""
    large_files = []
    
    for root, dirs, files in os.walk(root_path):
        for file in files:
            if file.endswith(('.js', '.mjs', '.cjs')):
                file_path = os.path.join(root, file)
                try:
                    size_kb = os.path.getsize(file_path) / 1024
                    if size_kb >= min_size_kb:
                        large_files.append({
                            'path': file_path,
                            'size_kb': round(size_kb, 2),
                            'rel_path': os.path.relpath(file_path, root_path)
                        })
                except:
                    pass
    
    return sorted(large_files, key=lambda x: x['size_kb'], reverse=True)

def main():
    root_path = '/Users/tatsuya/Desktop/システム開発/blc'
    
    # Find large JavaScript files
    large_files = find_large_js_files(root_path, min_size_kb=50)
    
    results = {
        'large_files_analyzed': len(large_files[:20]),
        'large_files': large_files[:20],
        'detailed_analysis': [],
        'directory_structure_summary': defaultdict(int)
    }
    
    # Analyze top 20 large files
    for file_info in large_files[:20]:
        try:
            with open(file_info['path'], 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(500000)  # Read first 500KB
            
            analysis = analyze_js_content(content, file_info['rel_path'])
            results['detailed_analysis'].append(analysis)
            
            # Extract directory names from all patterns
            all_paths = (
                analysis['patterns']['file_extensions'] +
                analysis['patterns']['path_separators'] +
                analysis['patterns']['error_stack_traces']
            )
            
            for path in all_paths:
                parts = path.replace('\\', '/').split('/')
                for part in parts:
                    if part and not part.startswith('.') and len(part) > 2:
                        results['directory_structure_summary'][part] += 1
        except Exception as e:
            print(f"Error analyzing {file_info['path']}: {e}")
    
    # Sort directory summary by frequency
    results['directory_structure_summary'] = dict(
        sorted(results['directory_structure_summary'].items(), 
               key=lambda x: x[1], reverse=True)[:30]
    )
    
    # Save results
    output_path = os.path.join(root_path, 'scripts', 'bundled_js_patterns_analysis.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"Analysis complete. Results saved to: {output_path}")
    print(f"\nLargest JavaScript files found:")
    for file_info in large_files[:10]:
        print(f"  - {file_info['rel_path']}: {file_info['size_kb']} KB")
    
    if results['directory_structure_summary']:
        print(f"\nMost common directory names found:")
        for dir_name, count in list(results['directory_structure_summary'].items())[:10]:
            print(f"  - {dir_name}: {count} occurrences")

if __name__ == '__main__':
    main()