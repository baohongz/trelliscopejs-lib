import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { fade } from 'material-ui/utils/colorManipulator';
import Panel from './Panel';
import { setLabels } from '../actions';
import { uiConstsSelector, contentWidthSelector, sidebarActiveSelector,
  contentHeightSelector } from '../selectors/ui';
import { cogInfoSelector } from '../selectors/display';
import { currentCogDataSelector } from '../selectors/cogData';
import { configSelector, cogInterfaceSelector, layoutSelector,
  aspectSelector, labelsSelector, panelRendererSelector,
  displayInfoSelector } from '../selectors';

const Content = ({ style, ccd, ci, cinfo, cfg, layout, labels, dims,
  panelRenderer, panelInterface, sidebar, removeLabel }) => {
  let ret = <div />;

  if (ci && ccd && cinfo && panelRenderer.fn !== null) {
    const panelKeys = [];
    const panelLabels = [];

    for (let i = 0; i < ccd.length; i += 1) {
      panelKeys.push(ccd[i].panelKey);
      const curLabels = [];
      for (let j = 0; j < labels.length; j += 1) {
        curLabels.push({
          name: labels[j],
          value: ccd[i][labels[j]],
          type: cinfo[labels[j]].type
        });
      }
      panelLabels.push(curLabels);
    }

    // populate a matrix with panel key and cog label information
    // const dataMatrix = new Array(layout.nrow);
    const panelMatrix = [];

    for (let i = 0; i < ccd.length; i += 1) {
      let rr;
      let cc;
      if (layout.arrange === 'row') {
        rr = Math.floor(i / layout.ncol);
        cc = i % layout.ncol;
      } else {
        rr = i % layout.nrow;
        cc = Math.floor(i / layout.nrow);
      }
      panelMatrix.push(
        {
          rowIndex: rr,
          colIndex: cc,
          iColIndex: layout.ncol - cc - 1,
          key: panelKeys[i],
          labels: panelLabels[i]
        }
      );
    }
    panelMatrix.sort((a, b) => ((a.key > b.key) ? 1 : ((b.key > a.key) ? -1 : 0)));

    // HACK: htmlwidget panels won't resize properly when layout or sidebar is toggled
    // so we need to add this to key to force it to re-draw
    let keyExtra = '';
    if (panelInterface.type === 'htmlwidget') {
      keyExtra = `_${layout.nrow}_${layout.ncol}_${sidebar}_${labels.length}`;
    }

    ret = (
      <div style={style.bounding}>
        {panelMatrix.map(el => (
          <Panel
            key={`${el.key}${keyExtra}`}
            cfg={cfg}
            panelKey={el.key}
            labels={el.labels}
            labelArr={labels}
            style={style.panel}
            iface={ci}
            panelRenderer={panelRenderer}
            panelInterface={panelInterface}
            removeLabel={removeLabel}
            dimStyle={{
              top: (dims.pHeight * el.rowIndex) + ((el.rowIndex + 1) * dims.pPad) +
                dims.hOffset + (el.rowIndex * 2),
              right: (dims.pWidth * el.iColIndex) + ((el.iColIndex + 1) * dims.pPad) +
                dims.wOffset + (el.iColIndex * 2) + 1
            }}
          />
        ))}
      </div>
    );
  }

  return (ret);
};

Content.propTypes = {
  style: React.PropTypes.object,
  ccd: React.PropTypes.array,
  ci: React.PropTypes.object,
  cinfo: React.PropTypes.object,
  cfg: React.PropTypes.object,
  layout: React.PropTypes.object,
  labels: React.PropTypes.array,
  dims: React.PropTypes.object,
  panelRenderer: React.PropTypes.object,
  panelInterface: React.PropTypes.object,
  sidebar: React.PropTypes.string
};

// ------ redux container ------

const styleSelector = createSelector(
  contentWidthSelector, contentHeightSelector, uiConstsSelector,
  currentCogDataSelector, cogInterfaceSelector,
  layoutSelector, aspectSelector, labelsSelector, cogInfoSelector,
  configSelector, panelRendererSelector, displayInfoSelector,
  sidebarActiveSelector,
  (cw, ch, ui, ccd, ci, layout, aspect, labels, cinfo, cfg, panelRenderer, di, sidebar) => {
    const pPad = ui.content.panel.pad; // padding on either side of the panel
    // height of row of cog label depends on number of rows
    // based on font size decreasing wrt rows as 1->14, 2->12, 3->10, 4+->7
    const labelHeightArr = [26, 24, 22, 19];
    const maxDim = Math.max(layout.nrow, layout.ncol - 2);
    const labelHeight = labelHeightArr[Math.min(maxDim - 1, 3)];
    const nLabels = labels.length; // number of cogs to show
    // extra padding beyond what is plotted
    // these remain fixed while width and height can change
    // for ppad + 2, "+ 2" is border
    const wExtra = (pPad + 2) * (layout.ncol + 1);
    const hExtra = ((pPad + 2) * (layout.nrow + 1)) +
      (nLabels * labelHeight * layout.nrow);

    // first try stretching panels across full width:
    let newW = Math.round((cw - wExtra) / layout.ncol, 0);
    // given this, compute panel height
    let newH = Math.round(newW * aspect, 0);
    let wOffset = 0;

    // check to see if this will make it too tall:
    // if so, do row-first full-height stretching
    if (((newH * layout.nrow) + hExtra) > ch) {
      newH = Math.round((ch - hExtra) / layout.nrow, 0);
      newW = Math.round(newH / aspect, 0);
      wOffset = (cw - ((newW * layout.ncol) + wExtra)) / 2;
    }

    const hOffset = ui.header.height;

    return ({
      style: {
        bounding: {
          // border: '3px solid red',
          background: '#fdfdfd',
          position: 'fixed',
          top: ui.header.height,
          right: 0,
          boxSizing: 'border-box',
          padding: 0,
          width: cw,
          height: ch
        },
        panel: {
          bounding: {
            transitionProperty: 'all',
            transitionDuration: ui.trans.duration,
            transitionTimingFunction: ui.trans.timing,
            position: 'fixed',
            overflow: 'hidden',
            width: newW + 2,
            height: newH + (nLabels * labelHeight) + 2,
            padding: 0,
            boxSizing: 'border-box',
            border: '1px solid #ddd'
          },
          panel: {
            transitionProperty: 'all',
            transitionDuration: ui.trans.duration,
            transitionTimingFunction: ui.trans.timing,
            width: newW,
            height: newH,
            boxSizing: 'border-box',
            // background: '#f6f6f6',
            textAlign: 'center',
            // lineHeight: `${newH}px`,
            color: '#bbb'
          },
          panelContent: {
            transitionProperty: 'all',
            transitionDuration: ui.trans.duration,
            transitionTimingFunction: ui.trans.timing,
            display: 'block',
            width: newW,
            height: newH
          },
          labelTable: {
            transitionProperty: 'all',
            transitionDuration: ui.trans.duration,
            transitionTimingFunction: ui.trans.timing,
            width: newW,
            padding: 0,
            tableLayout: 'fixed',
            borderSpacing: 0,
            boxSizing: 'border-box'
          },
          labelRow: {
            transitionProperty: 'all',
            transitionDuration: ui.trans.duration,
            transitionTimingFunction: ui.trans.timing,
            width: newW,
            height: labelHeight,
            fontSize: labelHeight - 12,
            background: '#f6f6f6'
          },
          labelRowHover: {
            background: fade('#f6f6f6', 0.4)
          },
          labelCell: {
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 8,
            paddingRight: 8
            // borderTop: '1px solid white'
          },
          labelNameCell: {
            width: '33%',
            borderRight: '1px solid #fff',
            fontWeight: 400
          },
          labelValueCell: {
            width: '67%'
          },
          labelOverflow: {
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
          },
          labelClose: {
            float: 'right',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            padding: 0,
            margin: 0,
            opacity: 0.5,
            fontSize: 15
          }
        }
      },
      ccd,
      ci,
      cinfo,
      cfg,
      layout,
      labels,
      dims: {
        pWidth: newW,
        pHeight: newH + (nLabels * labelHeight),
        wOffset,
        hOffset,
        pPad
      },
      panelRenderer,
      panelInterface: di.info.panelInterface,
      sidebar
    });
  }
);

const mapStateToProps = state => (
  styleSelector(state)
);

const mapDispatchToProps = dispatch => ({
  removeLabel: (name, labels) => {
    const idx = labels.indexOf(name);
    if (idx > -1) {
      const newLabels = Object.assign([], labels);
      newLabels.splice(idx, 1);
      dispatch(setLabels(newLabels));
    }
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Content);
