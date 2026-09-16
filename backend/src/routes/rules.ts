import { Router, Request, Response } from 'express';
import { RuleEngine } from '../services/RuleEngine.js';

const router = Router();

// Extend Express Request to include ruleEngine and io
interface RequestWithEngine extends Request {
  ruleEngine?: RuleEngine;
  io?: any;
}

// Get active rules
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const req = _req as RequestWithEngine;
  const ruleEngine = req.ruleEngine;
  
  if (!ruleEngine) {
    res.status(500).json({ error: 'Rule engine not available' });
    return;
  }

  try {
    const activeRules = ruleEngine.getActiveRules();
    res.json({ success: true, data: activeRules, count: activeRules.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get specific rule status
router.get('/:graphId/status', async (req: Request, res: Response): Promise<void> => {
  const { graphId } = req.params;
  const engineReq = req as RequestWithEngine;
  const ruleEngine = engineReq.ruleEngine;

  if (!ruleEngine) {
    res.status(500).json({ error: 'Rule engine not available' });
    return;
  }

  try {
    const status = ruleEngine.getRuleStatus(graphId);
    if (!status) {
      res.status(404).json({ error: 'Rule not active' });
      return;
    }

    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Activate rule (compile and execute)
router.post('/:graphId/activate', async (req: Request, res: Response): Promise<void> => {
  const { graphId } = req.params;
  const { graph } = req.body;
  const engineReq = req as RequestWithEngine;
  const ruleEngine = engineReq.ruleEngine;

  if (!ruleEngine) {
    res.status(500).json({ error: 'Rule engine not available' });
    return;
  }

  if (!graph) {
    res.status(400).json({ error: 'Graph data required in request body' });
    return;
  }

  try {
    const result = ruleEngine.activateRule(graphId, graph);

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json({
      success: true,
      message: result.message,
      graphId,
      status: 'active',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Deactivate rule
router.post('/:graphId/deactivate', async (req: Request, res: Response): Promise<void> => {
  const { graphId } = req.params;
  const engineReq = req as RequestWithEngine;
  const ruleEngine = engineReq.ruleEngine;

  if (!ruleEngine) {
    res.status(500).json({ error: 'Rule engine not available' });
    return;
  }

  try {
    const result = ruleEngine.deactivateRule(graphId);

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json({
      success: true,
      message: result.message,
      graphId,
      status: 'inactive',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Test rule compilation
router.post('/test/compile', async (req: Request, res: Response): Promise<void> => {
  const { graph } = req.body;

  if (!graph) {
    res.status(400).json({ error: 'Graph data required' });
    return;
  }

  try {
    // Validate graph structure
    if (!graph.nodes || !Array.isArray(graph.nodes)) {
      res.status(400).json({ error: 'Invalid graph: nodes array required' });
      return;
    }

    if (!graph.edges || !Array.isArray(graph.edges)) {
      res.status(400).json({ error: 'Invalid graph: edges array required' });
      return;
    }

    res.json({
      success: true,
      message: 'Graph structure valid',
      graph: {
        name: graph.name,
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Compilation failed' });
  }
});

export default router;
