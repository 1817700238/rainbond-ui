import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import {
  Row,
  Col,
  Card,
  Form,
  Select,
  Button,
  Icon,
  Input,
  Table,
  Modal,
  notification,
  Tooltip,
} from 'antd';
import {
  getRelationedApp,
  removeRelationedApp,
  batchAddRelationedApp,
} from '../../services/app';
import styles from './Index.less';
import globalUtil from '../../utils/global';
import ConfirmModal from '../../components/ConfirmModal';
import AddRelation from '../../components/AddRelation';
import ScrollerX from '../../components/ScrollerX';
import EnvironmentVariable from '../../components/EnvironmentVariable';

const FormItem = Form.Item;
const Option = Select.Option;

// 查看连接信息
class ViewRelationInfo extends PureComponent {

  render() {
    const { appAlias, onCancel } = this.props;
    const wraps = {
      wordBreak: 'break-all',
      wordWrap: 'break-word',
    };
    return (
      <Modal
        title="依赖信息查看"
        width={1000}
        visible
        onCancel={onCancel}
        footer={[<Button onClick={onCancel}>关闭</Button>]}
      >
        <EnvironmentVariable
          title=""
          type="OuterEnvs"
          autoQuery
          appAlias={appAlias}
        />
      </Modal>
    );
  }
}

@connect(
  ({ user, appControl }) => ({
    currUser: user.currentUser,
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      showAddRelation: false,
      linkList: [],
      relationList: [],
      viewRelationInfo: null,
      showText: null,
      transfer: null,
    };
  }

  shouldComponentUpdate() {
    return true;
  }
  componentDidMount() {
    const { dispatch } = this.props;
    this.loadRelationedApp();
  }
  loadRelationedApp = () => {
    getRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
    }).then(res => {
      if (res) {
        let arr = res.bean.port_list;
        if (res.list && res.list.length > 0) {
          res.list.map((item, index) => {
            const { ports_list } = item;
            arr = arr.concat(ports_list);
          });
        }
        arr = this.isRepeat(arr);
        this.setState({ relationList: res.list || [], showText: arr });
      }
    });
  };
  isRepeat = arr => {
    const hash = {};

    for (const i in arr) {
      if (hash[arr[i]])
        // hash 哈希

        return true;
      hash[arr[i]] = true;
    }
    return false;
  };
  showAddRelation = () => {
    this.setState({ showAddRelation: true });
  };
  handleCancelAddRelation = () => {
    this.setState({ showAddRelation: false });
  };
  handleSubmitAddRelation = ids => {
    batchAddRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      dep_service_ids: ids,
    }).then(data => {
      if (data) {
        notification.info({ message: '需要更新才能生效' });
        this.loadRelationedApp();
        this.handleCancelAddRelation();
      }
    });
  };

  handleRemoveRelationed = app => {
    removeRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      dep_service_id: app.service_id,
    }).then(data => {
      if (data) {
        this.loadRelationedApp();
      }
    });
  };

  onViewRelationInfo = data => {
    this.setState({ viewRelationInfo: data });
  };
  cancelViewRelationInfo = data => {
    this.setState({ viewRelationInfo: null });
  };

  render() {
    const { showText, relationList } = this.state;
    const { appAlias } = this.props;
    return (
      <Fragment>
        <EnvironmentVariable
          title="组件连接信息"
          type="Outer"
          autoQuery
          appAlias={appAlias}
        />
        <Card
          title={[
            <span>依赖组件信息</span>,
            <span style={{ color: 'red' }}>
              {showText && '（依赖的组件有相同的端口冲突,请处理）'}
            </span>,
          ]}
        >
          <ScrollerX sm={650}>
            <Table
              pagination={false}
              columns={[
                {
                  title: '组件名',
                  dataIndex: 'service_cname',
                  render: (val, data) => (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
                        data.service_alias
                      }/overview`}
                    >
                      {val}
                    </Link>
                  ),
                },
                {
                  title: '所属应用',
                  dataIndex: 'group_name',
                  render: (val, data) => (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                        data.group_id
                      }`}
                    >
                      {val}
                    </Link>
                  ),
                },
                {
                  title: '操作',
                  dataIndex: 'var',
                  render: (val, data) => (
                    <Fragment>
                      <a
                        onClick={() => this.onViewRelationInfo(data)}
                        href="javascript:;"
                        style={{ margintRight: 10 }}
                      >
                        连接信息
                      </a>
                      <a
                        onClick={() => {
                          this.handleRemoveRelationed(data);
                        }}
                        href="javascript:;"
                        style={{ margintRight: 10 }}
                      >
                        取消依赖
                      </a>
                    </Fragment>
                  ),
                },
              ]}
              dataSource={relationList}
            />
          </ScrollerX>
          <div style={{ marginTop: 10, textAlign: 'right' }}>
            <Button onClick={this.showAddRelation}>
              <Icon type="plus" /> 添加依赖
            </Button>
          </div>
        </Card>

        {this.state.showAddRelation && (
          <AddRelation
            appAlias={this.props.appAlias}
            onCancel={this.handleCancelAddRelation}
            onSubmit={this.handleSubmitAddRelation}
          />
        )}
        {this.state.viewRelationInfo && (
          <ViewRelationInfo
            appAlias={this.state.viewRelationInfo.service_alias}
            onCancel={this.cancelViewRelationInfo}
          />
        )}
      </Fragment>
    );
  }
}
