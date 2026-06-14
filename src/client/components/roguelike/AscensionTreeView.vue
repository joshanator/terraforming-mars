<template>
  <div class="ascension-tree-view">
    <div
      ref="scrollContainer"
      class="ascension-tree-view__scroll"
      :class="{'ascension-tree-view__scroll--dragging': isDragging}"
      @mousedown="onScrollMouseDown"
    >
      <div
        class="ascension-tree-view__canvas"
        :style="{width: bounds.width + 'px', height: bounds.height + 'px'}"
      >
        <svg
          class="ascension-tree-view__edges"
          :width="bounds.width"
          :height="bounds.height"
        >
          <defs>
            <marker
              id="ascension-edge-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
            </marker>
          </defs>
          <path
            v-for="edge in flowEdges"
            :key="edge.id"
            :d="edgePath(edge)"
            class="ascension-tree-view__edge"
            :class="{'ascension-tree-view__edge--active': edge.data.active}"
            marker-end="url(#ascension-edge-arrow)"
          />
        </svg>
        <AscensionTreeNode
          v-for="node in flowNodes"
          :key="node.id"
          :node-data="node.data"
          :style="nodeStyle(node)"
          @unlock="onUnlock"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import AscensionTreeNode from '@/client/components/roguelike/AscensionTreeNode.vue';
import {
  buildAscensionFlowGraph,
  getAscensionGraphBounds,
  getAscensionEdgePath,
  AscensionFlowEdge,
  AscensionFlowNode,
} from '@/client/utils/AscensionFlowGraph';
import {AscensionNodeId} from '@/common/roguelike/AscensionTree';

export default defineComponent({
  name: 'AscensionTreeView',
  components: {AscensionTreeNode},
  props: {
    unlockedNodes: {
      type: Object as PropType<Set<AscensionNodeId>>,
      required: true,
    },
    availablePoints: {
      type: Number,
      required: true,
    },
  },
  emits: ['unlock'],
  data() {
    return {
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      dragScrollLeft: 0,
      dragScrollTop: 0,
    };
  },
  computed: {
    flowGraph(): ReturnType<typeof buildAscensionFlowGraph> {
      return buildAscensionFlowGraph(undefined, this.unlockedNodes, this.availablePoints);
    },
    flowNodes(): ReadonlyArray<AscensionFlowNode> {
      return this.flowGraph.nodes;
    },
    flowEdges(): ReadonlyArray<AscensionFlowEdge> {
      return this.flowGraph.edges;
    },
    nodePositions(): Map<string, {x: number; y: number}> {
      return new Map(this.flowNodes.map((node) => [node.id, node.position]));
    },
    bounds(): {width: number; height: number} {
      return getAscensionGraphBounds(this.flowNodes);
    },
  },
  mounted() {
    window.addEventListener('mousemove', this.onScrollMouseMove);
    window.addEventListener('mouseup', this.onScrollMouseUp);
  },
  beforeUnmount() {
    window.removeEventListener('mousemove', this.onScrollMouseMove);
    window.removeEventListener('mouseup', this.onScrollMouseUp);
  },
  methods: {
    onScrollMouseDown(event: MouseEvent): void {
      if (event.button !== 0) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, .ascension-node__action')) {
        return;
      }
      const container = this.$refs.scrollContainer as HTMLElement | undefined;
      if (!container) {
        return;
      }
      this.isDragging = true;
      this.dragStartX = event.pageX;
      this.dragStartY = event.pageY;
      this.dragScrollLeft = container.scrollLeft;
      this.dragScrollTop = container.scrollTop;
    },
    onScrollMouseMove(event: MouseEvent): void {
      if (!this.isDragging) {
        return;
      }
      const container = this.$refs.scrollContainer as HTMLElement | undefined;
      if (!container) {
        return;
      }
      event.preventDefault();
      container.scrollLeft = this.dragScrollLeft - (event.pageX - this.dragStartX);
      container.scrollTop = this.dragScrollTop - (event.pageY - this.dragStartY);
    },
    onScrollMouseUp(): void {
      this.isDragging = false;
    },
    nodeStyle(node: AscensionFlowNode): Record<string, string> {
      return {
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
      };
    },
    edgePath(edge: AscensionFlowEdge): string {
      const from = this.nodePositions.get(edge.source);
      const to = this.nodePositions.get(edge.target);
      if (!from || !to) {
        return '';
      }
      return getAscensionEdgePath(from, to, edge.data.backward);
    },
    onUnlock(nodeId: string): void {
      this.$emit('unlock', nodeId);
    },
  },
});
</script>

<style scoped>
.ascension-tree-view {
  width: 100%;
  height: 620px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #2f3a4d;
  background: radial-gradient(circle at top, rgba(36, 48, 68, 0.55), rgba(12, 16, 24, 0.95));
}

.ascension-tree-view__scroll {
  width: 100%;
  height: 100%;
  overflow: auto;
  cursor: grab;
}

.ascension-tree-view__scroll--dragging {
  cursor: grabbing;
  user-select: none;
}

.ascension-tree-view__canvas {
  position: relative;
  min-width: 100%;
  background-image: radial-gradient(circle, #2a3344 1px, transparent 1px);
  background-size: 18px 18px;
}

.ascension-tree-view__edges {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
}

.ascension-tree-view__edge {
  fill: none;
  stroke: #3a4a60;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ascension-tree-view__edge--active {
  stroke: #6ea8dc;
}
</style>
