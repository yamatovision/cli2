from extensions.security.analyzer import SecurityAnalyzer
from extensions.security.invariant.analyzer import InvariantAnalyzer

SecurityAnalyzers: dict[str, type[SecurityAnalyzer]] = {
    'invariant': InvariantAnalyzer,
}
