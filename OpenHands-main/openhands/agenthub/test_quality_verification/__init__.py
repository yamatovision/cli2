"""Test Quality Verification Agent"""

from openhands.agenthub.test_quality_verification.test_quality_verification import TestQualityVerification
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('TestQualityVerification', TestQualityVerification)

__all__ = ['TestQualityVerification']