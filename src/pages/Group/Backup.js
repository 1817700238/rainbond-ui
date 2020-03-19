import React, { PureComponent, Fragment } from "react";
import moment from "moment";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import {
  Card,
  Button,
  Table,
  notification,
  List,
  Modal,
  Radio,
  Input,
  Form,
  Tooltip,
  Icon,
  Alert
} from "antd";
import globalUtil from "../../utils/global";
import sourceUtil from "../../utils/source-unit";
import ScrollerX from "../../components/ScrollerX";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import userUtil from "../../utils/user";
import logSocket from "../../utils/logSocket";
import ConfirmModal from "../../components/ConfirmModal";
import styles from "../../components/CreateTeam/index.less";
import MigrationBackup from "../../components/MigrationBackup";
import RestoreBackup from "../../components/RestoreBackup";
import ImportBackup from "../../components/ImportBackup";
import apiconfig from "../../../config/api.config";
import {
  createEnterprise,
  createTeam,
  createApp
} from "../../utils/breadcrumb";

const { TextArea } = Input;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

@connect(({ user, appControl }) => ({ currUser: user.currentUser }))
class BackupStatus extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      map: {
        starting: "备份中",
        success: "备份成功",
        failed: "备份失败"
      }
    };
    this.timer = null;
  }
  componentDidMount() {
    const data = this.props.data;
    if (data.status === "starting") {
      this.createSocket();
      this.startLoopStatus();
    }
  }

  createSocket() {
    this.logSocket = new logSocket({
      url: this.getSocketUrl(),
      eventId: this.props.data.event_id,
      onMessage: msg => {
        // console.log(msg);
      }
    });
  }
  componentWillUnmount() {
    this.stopLoopStatus();
    this.logSocket && this.logSocket.destroy();
    this.logSocket = null;
  }
  getSocketUrl = () => {
    return userUtil.getCurrRegionSoketUrl(this.props.currUser);
  };
  startLoopStatus() {
    this.props.dispatch({
      type: "groupControl/fetchBackupStatus",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        backup_id: this.props.data.backup_id,
        group_id: this.props.group_id
      },
      callback: data => {
        if (data) {
          const bean = data.bean;
          if (bean.status === "starting") {
            this.timer = setTimeout(() => {
              this.startLoopStatus();
            }, 10000);
          } else {
            this.props.onEnd && this.props.onEnd();
          }
        }
      }
    });
  }
  stopLoopStatus() {
    clearTimeout(this.timer);
  }
  render() {
    const data = this.props.data || {};
    return (
      <span>
        {this.state.map[data.status]}{" "}
        {data.status === "starting" && (
          <Icon style={{ marginLeft: 8 }} type="loading" spin />
        )}
      </span>
    );
  }
}

@Form.create()
class Backup extends PureComponent {
  componentDidMount() {}
  state = {};
  onOk = e => {
    e.preventDefault();
    const form = this.props.form;
    const { onOk, warningText } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      let obj = fieldsValue;
      if (warningText) {
        obj.force = true;
      }
      onOk && onOk(obj);
    });
  };
  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const data = this.props.data || {};
    const is_configed = this.props.is_configed;
    const { componentList, warningText, onCancel } = this.props;
    const formItemLayout = {
      labelCol: {
        span: 5
      },
      wrapperCol: {
        span: 19
      }
    };
    const cloudBackupTip = is_configed
      ? "备份到云端存储上，可实现跨集群迁移"
      : "请在Rainbond管理后台开启此功能";
    return (
      <Modal
        title={"新增备份"}
        visible={true}
        className={styles.TelescopicModal}
        onOk={this.onOk}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}> 取消 </Button>,
          <Button type="primary" onClick={this.onOk}>
            {warningText ? "强制备份" : "确定"}
          </Button>
        ]}
      >
        <Form layout="horizontal">
          <Form.Item {...formItemLayout} label={<span>备份方式</span>}>
            {getFieldDecorator("mode", {
              initialValue: is_configed
                ? data.mode || "full-online"
                : "full-offline",
              rules: [{ required: true, message: "要创建的应用还没有名字" }]
            })(
              <RadioGroup>
                <Tooltip title={cloudBackupTip}>
                  <RadioButton disabled={!is_configed} value="full-online">
                    云端备份
                  </RadioButton>
                </Tooltip>
                <Tooltip title="备份到当前集群本地，不能跨集群迁移">
                  <RadioButton value="full-offline">本地备份</RadioButton>
                </Tooltip>
              </RadioGroup>
            )}
          </Form.Item>
          <Form.Item {...formItemLayout} label="备份说明">
            {getFieldDecorator("note", {
              initialValue: data.note || "",
              rules: [{ required: true, message: "请写入备份说明" }]
            })(<TextArea placeholder="请写入备份说明" />)}
          </Form.Item>

          {warningText && (
            <div>
              <Alert message={warningText} type="warning" />
              <List
                size="small"
                style={{ margin: "10px 0" }}
                header={
                  <h6 style={{ marginBottom: "0", fontSize: "15px" }}>
                    组件名称
                  </h6>
                }
                // footer={<div>Footer</div>}
                bordered
                dataSource={componentList}
                renderItem={item => <List.Item>{item}</List.Item>}
              />
            </div>
          )}
        </Form>
      </Modal>
    );
  }
}

@connect(({ user, global, teamControl, enterprise }) => ({
  currUser: user.currentUser,
  groups: global.groups || [],
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise
}))
export default class AppList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      list: [],
      teamAction: {},
      page: 1,
      total: 0,
      pageSize: 6,
      showBackup: false,
      showMove: false,
      showDel: false,
      showRecovery: false,
      showExport: false,
      showImport: false,
      backup_id: "",
      appDetail: {},
      is_configed: null,
      group_uuid: "",
      event_id: "",
      warningText: "",
      componentList: []
    };
  }
  componentDidMount() {
    this.fetchAppDetail();
    this.fetchBackup();
  }

  componentWillUnmount() {}
  fetchBackup = () => {
    const { teamName, appID } = this.props.match.params;
    this.props.dispatch({
      type: "groupControl/fetchBackup",
      payload: {
        team_name: teamName,
        group_id: appID,
        page: this.state.page,
        page_size: this.state.pageSize
      },
      callback: data => {
        if (data) {
          this.setState({
            list: data.list || [],
            total: data.total,
            is_configed: data.bean.is_configed
          });
        }
      }
    });
  };
  onBackup = () => {
    this.setState({ showBackup: true });
  };
  cancelBackup = () => {
    this.setState({ showBackup: false, warningText: "", componentList: [] });
  };
  handleBackup = data => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "groupControl/backup",
      payload: {
        team_name: team_name,
        group_id: this.getGroupId(),
        ...data
      },
      callback: () => {
        this.cancelBackup();
        this.fetchBackup();
      },
      handleError: res => {
        if (res) {
          if (res.data && res.data.code) {
            if (res.data.code === 4122) {
              this.setState({
                warningText: "备份有异常 ：组件使用了自定义存储，是否强制备份",
                componentList: res.data.data.list || []
              });
            }
            if (res.data.code === 4121) {
              this.setState({
                warningText: "备份有异常 ：有状态组件未停止，是否强制备份",
                componentList: res.data.data.list || []
              });
            }
          }
        }
      }
    });
  };

  fetchAppDetail = () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    this.setState({ loadingDetail: true });
    dispatch({
      type: "groupControl/fetchGroupDetail",
      payload: {
        team_name: teamName,
        region_name: regionName,
        group_id: appID
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            appDetail: res.bean,
            loadingDetail: false
          });
        }
      },
      handleError: res => {
        if (res && res.code === 404) {
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps`
            )
          );
        }
      }
    });
  };
  // 倒入备份
  toAdd = () => {
    this.setState({ showImport: true });
  };
  handleImportBackup = e => {
    notification.success({
      message: "备份已导入",
      duration: 2
    });
    this.setState({ showImport: false });
    this.fetchBackup();
  };
  cancelImportBackup = () => {
    this.setState({ showImport: false });
    this.fetchBackup();
  };
  // 恢复应用备份
  handleRecovery = (data, e) => {
    this.setState({
      showRecovery: true,
      backup_id: data.backup_id,
      group_uuid: data.group_uuid
    });
  };
  handleRecoveryBackup = () => {
    this.setState({ showRecovery: false, backup_id: "" });
    this.fetchBackup();
  };
  cancelRecoveryBackup = () => {
    this.setState({ showRecovery: false, backup_id: "" });
    this.fetchBackup();
  };
  // 迁移应用备份
  handleMove = (data, e) => {
    this.setState({
      showMove: true,
      backup_id: data.backup_id,
      group_uuid: data.group_uuid
    });
  };
  handleMoveBackup = () => {
    this.setState({ showMove: false });
  };
  cancelMoveBackup = () => {
    this.setState({ showMove: false, backup_id: "" });
  };
  // 导出应用备份

  handleExport = (data, e) => {
    var backup_id = data.backup_id;
    var team_name = globalUtil.getCurrTeamName();
    var group_id = this.getGroupId();
    var exportURl =
      apiconfig.baseUrl +
      "/console/teams/" +
      team_name +
      "/groupapp/" +
      group_id +
      "/backup/export?backup_id=" +
      backup_id;
    window.open(exportURl);
    notification.success({
      message: "备份导出中",
      duration: 2
    });
  };
  // 删除应用备份
  handleDel = (data, e) => {
    this.setState({ showDel: true, backup_id: data.backup_id });
  };
  handleDelete = e => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "groupControl/delBackup",
      payload: {
        team_name: team_name,
        group_id: this.getGroupId(),
        backup_id: this.state.backup_id
      },
      callback: data => {
        if (data) {
          notification.success({
            message: "删除成功",
            duration: 2
          });
          this.cancelDelete();
          this.fetchBackup();
        }
      }
    });
  };
  cancelDelete = e => {
    this.setState({ showDel: false, backup_id: "" }, () => {
      this.fetchBackup();
    });
  };
  jumpToAllbackup = () => {
    this.props.dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/allbackup`
      )
    );
  };

  getGroupId = () => {
    const params = this.props.match.params;
    return params.appID;
  };
  render() {
    const columns = [
      {
        title: "备份时间",
        dataIndex: "create_time"
      },
      {
        title: "备份人",
        dataIndex: "user"
      },
      {
        title: "备份模式",
        dataIndex: "mode",
        render: (val, data) => {
          var map = {
            "full-online": "云端备份",
            "full-offline": "本地备份"
          };
          return map[val] || "";
        }
      },
      {
        title: "包大小",
        dataIndex: "backup_size",
        render: (val, data) => {
          return sourceUtil.unit(val, "Byte");
        }
      },
      {
        title: "状态",
        dataIndex: "status",
        render: (val, data) => {
          return (
            <BackupStatus
              onEnd={this.fetchBackup}
              group_id={this.getGroupId()}
              data={data}
            />
          );
        }
      },
      {
        title: "备注",
        dataIndex: "note"
      },
      {
        title: "操作",
        dataIndex: "action",
        render: (val, data) => {
          return (
            <div>
              {data.status == "success" ? (
                <Fragment>
                  <a
                    href="javascript:;"
                    style={{ marginRight: "5px" }}
                    onClick={this.handleRecovery.bind(this, data)}
                  >
                    恢复
                  </a>
                  <a
                    href="javascript:;"
                    style={{ marginRight: "5px" }}
                    onClick={this.handleMove.bind(this, data)}
                  >
                    迁移
                  </a>
                  {data.mode == "full-online" && (
                    <a
                      href="javascript:;"
                      style={{ marginRight: "5px" }}
                      onClick={this.handleExport.bind(this, data)}
                    >
                      导出
                    </a>
                  )}
                  <a
                    href="javascript:;"
                    onClick={this.handleDel.bind(this, data)}
                  >
                    删除
                  </a>
                </Fragment>
              ) : (
                ""
              )}
              {data.status == "failed" ? (
                <Fragment>
                  <a
                    href="javascript:;"
                    onClick={this.handleDel.bind(this, data)}
                  >
                    删除
                  </a>
                </Fragment>
              ) : (
                ""
              )}
            </div>
          );
        }
      }
    ];

    const list = this.state.list || [];
    let breadcrumbList = [];
    const { appDetail, loadingDetail } = this.state;
    const { currentEnterprise, currentTeam, currentRegionName } = this.props;
    breadcrumbList = createApp(
      createTeam(
        createEnterprise(breadcrumbList, currentEnterprise),
        currentTeam,
        currentRegionName
      ),
      currentTeam,
      currentRegionName,
      { appName: appDetail.group_name, appID: appDetail.group_id }
    );
    return (
      <PageHeaderLayout
        loading={loadingDetail}
        breadcrumbList={breadcrumbList}
        title="备份管理"
        content={
          <p>
            应用备份是指将当前应用元数据、持久化数据、版本数据完整备份，备份记录可用于应用迁移和回滚，云端备份记录可用于跨集群应用迁移操作
          </p>
        }
        extraContent={
          <div>
            <Button
              style={{ marginRight: 8 }}
              type="primary"
              onClick={this.onBackup}
            >
              新增备份
            </Button>
            <Button style={{ marginRight: 8 }} onClick={this.toAdd}>
              导入备份
            </Button>
            <Button onClick={this.jumpToAllbackup} href="javascript:;">
              全部备份
            </Button>
          </div>
        }
      >
        <Card>
          <ScrollerX sm={800}>
            <Table
              rowKey={data => {
                return data.backup_id;
              }}
              pagination={{
                current: this.state.page,
                total: this.state.total,
                pageSize: this.state.pageSize,
                onChange: page => {
                  this.setState({ page: page }, () => {
                    this.fetchBackup();
                  });
                }
              }}
              columns={columns}
              dataSource={list}
            />
          </ScrollerX>
        </Card>

        {this.state.showBackup && (
          <Backup
            warningText={this.state.warningText}
            componentList={this.state.componentList}
            is_configed={this.state.is_configed}
            onOk={this.handleBackup}
            onCancel={this.cancelBackup}
          />
        )}
        {this.state.showMove && (
          <MigrationBackup
            onOk={this.handleMoveBackup}
            onCancel={this.cancelMoveBackup}
            backupId={this.state.backup_id}
            groupId={this.getGroupId()}
            group_uuid={this.state.group_uuid}
          />
        )}
        {this.state.showRecovery && (
          <RestoreBackup
            onOk={this.handleRecoveryBackup}
            onCancel={this.cancelRecoveryBackup}
            propsParams={this.props.match.params}
            backupId={this.state.backup_id}
            group_uuid={this.state.group_uuid}
            groupId={this.getGroupId()}
          />
        )}
        {this.state.showImport && (
          <ImportBackup
            onReLoad={this.handleImportBackup}
            onCancel={this.cancelImportBackup}
            backupId={this.state.backup_id}
            groupId={this.getGroupId()}
          />
        )}
        {this.state.showDel && (
          <ConfirmModal
            backupId={this.state.backup_id}
            onOk={this.handleDelete}
            onCancel={this.cancelDelete}
            title="删除备份"
            desc="确定要删除此备份吗？"
            subDesc="此操作不可恢复"
          />
        )}
      </PageHeaderLayout>
    );
  }
}
