import { Router, Request, Response } from 'express';
import { Graph } from '../models/Graph.js';

const router = Router();

// Get all graphs
router.get('/', async (_req: Request, res: Response) => {
  try {
    const graphs = await Graph.find().limit(50);
    res.json({ success: true, data: graphs });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get graph by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const graph = await Graph.findById(req.params.id);
    if (!graph) {
      res.status(404).json({ success: false, error: 'Graph not found' });
      return;
    }
    res.json({ success: true, data: graph });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create new graph
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, nodes, edges } = req.body;
    const graph = new Graph({ name, description, nodes, edges });
    await graph.save();
    res.status(201).json({ success: true, data: graph });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update graph
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const graph = await Graph.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!graph) {
      res.status(404).json({ success: false, error: 'Graph not found' });
      return;
    }
    res.json({ success: true, data: graph });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete graph
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const graph = await Graph.findByIdAndDelete(req.params.id);
    if (!graph) {
      res.status(404).json({ success: false, error: 'Graph not found' });
      return;
    }
    res.json({ success: true, message: 'Graph deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
