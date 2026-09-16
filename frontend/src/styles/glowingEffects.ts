const glowingStyles = `
  @keyframes flow-glow {
    0%, 100% {
      filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.5));
      opacity: 0.8;
    }
    50% {
      filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.9));
      opacity: 1;
    }
  }

  @keyframes data-flow {
    0% {
      stroke-dashoffset: 1000;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }

  @keyframes node-pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
    }
  }

  @keyframes node-glow {
    0% {
      filter: drop-shadow(0 0 0px rgba(59, 130, 246, 0));
    }
    50% {
      filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.8));
    }
    100% {
      filter: drop-shadow(0 0 0px rgba(59, 130, 246, 0));
    }
  }

  @keyframes wire-shimmer {
    0% {
      opacity: 0.6;
      stroke-width: 2px;
    }
    50% {
      opacity: 1;
      stroke-width: 3px;
    }
    100% {
      opacity: 0.6;
      stroke-width: 2px;
    }
  }

  @keyframes shimmer {
    0% {
      stroke-dashoffset: 1000;
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
    100% {
      stroke-dashoffset: 0;
      opacity: 0.3;
    }
  }

  .reactflow-edge.active-edge {
    animation: wire-shimmer 1.5s ease-in-out infinite;
  }

  .reactflow-edge.active-edge path {
    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8));
    stroke: #60a5fa;
  }

  .reactflow-node.processing {
    animation: node-pulse 1.5s ease-in-out infinite;
  }

  .reactflow-node.alert {
    animation: node-glow 2s ease-in-out infinite;
  }

  .react-flow__edge-path.animated {
    animation: data-flow 3s linear infinite;
    stroke-dasharray: 1000;
  }

  .reactflow-node.datasource {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  }

  .reactflow-node.datasource.active {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
    border-color: #60a5fa;
    background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
  }

  .reactflow-node.filter {
    border-color: #10b981;
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  }

  .reactflow-node.filter.active {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.8);
    border-color: #34d399;
    background: linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%);
  }

  .reactflow-node.transform {
    border-color: #8b5cf6;
    background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  }

  .reactflow-node.transform.active {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.8);
    border-color: #a78bfa;
    background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%);
  }

  .reactflow-node.aggregate {
    border-color: #f59e0b;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  }

  .reactflow-node.aggregate.active {
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.8);
    border-color: #fbbf24;
    background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
  }

  .reactflow-node.trigger {
    border-color: #ef4444;
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  }

  .reactflow-node.trigger.active {
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
    border-color: #f87171;
    background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  }

  .reactflow-node,
  .reactflow-edge,
  .react-flow__edge-path {
    transition: all 0.3s ease;
  }

  .react-flow__handle:hover {
    width: 30px !important;
    height: 30px !important;
    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
  }

  .reactflow-edge:hover path {
    stroke-width: 4;
    filter: drop-shadow(0 0 12px rgba(59, 130, 246, 1));
  }

  .react-flow__pane {
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  }

  .react-flow__viewport {
    scroll-behavior: smooth;
  }

  .reactflow-node.active {
    outline: 2px solid rgba(59, 130, 246, 0.5);
    outline-offset: 2px;
  }

  .reactflow-node > div {
    padding: 8px 12px;
    border-radius: 6px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: white;
    font-size: 14px;
  }
`;

export default glowingStyles;
