import React, { PureComponent, Fragment } from 'react';

import { connect } from 'dva';
import {
  Card,
  Button,
  Col,
  Row,
  Menu,
  Dropdown,
  Icon,
  Spin,
  List,
  Tag,
  Radio,
  Input,
  Tooltip,
  Pagination,
  notification,
  Avatar,
} from 'antd';
import { routerRedux } from 'dva/router';
import BasicListStyles from '../List/BasicList.less';
import userUtil from '../../utils/user';
import CloudApp from './CloudApp';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import rainbondUtil from '../../utils/rainbond';

import styles from './index.less';

const { Search } = Input;

@connect(({ user, global }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
}))
export default class EnterpriseShared extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      loading: true,
      page_size: 10,
      total: 0,
      app_name: '',
      page: 1,
      scope: 'enterprise',
      showCloudApp: true,
      componentList: [],
    };
  }
  componentDidMount() {
    const { user } = this.props;
    if (user) {
      this.load();
    }
  }
  handleSearch = app_name => {
    this.setState(
      {
        app_name,
        page: 1,
      },
      () => {
        this.load();
      }
    );
  };
  load = () => {
    this.getApps();
  };

  handlePageChange = page => {
    this.setState(
      {
        page,
      },
      () => {
        this.getApps();
      }
    );
  };

  getApps = () => {
    const {
      dispatch,
      user,
      match: {
        params: { eid },
      },
    } = this.props;
    const { page, page_size, app_name, scope } = this.state;
    dispatch({
      type: 'market/fetchAppModels',
      payload: {
        enterprise_id: eid,
        user_id: user.user_id,
        app_name,
        scope,
        page,
        page_size,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            componentList: res.list,
            loading: false,
          });
        }
      },
    });
  };
  getAction = item => {
    if (item.versions_info && item.versions_info.length > 0) {
      return (
        <Fragment>
          {item.versions_info.map((item, index) => {
            return (
              <Tag
                style={{
                  height: '17px',
                  lineHeight: '16px',
                  color: '#999999',
                  border: 'none',
                  background: 'none',
                }}
                size="small"
                key={index}
              >
                {item.version}
              </Tag>
            );
          })}
        </Fragment>
      );
    }
    return '-';
  };
  render() {
    const { componentList } = this.state;
    const {
      rainbondInfo,
      enterprise,
      match: {
        params: { eid },
      },
    } = this.props;
    const paginationProps = {
      page_size: this.state.page_size,
      total: this.state.total,
      current: this.state.page,
      onChange: page_size => {
        this.handlePageChange(page_size);
      },
    };
    return (
      <PageHeaderLayout
        title="云端应用商店应用同步"
        content="从指定的云端应用商店同步应用模版到本地，可同步应用一般是公开免费应用和已购买应用"
      >
        <div className={styles.descText}>
          <Icon type="exclamation-circle" />
          {`当前共享库${rainbondUtil.appstoreImageHubEnable(
            enterprise
          )}跨集群互联功能`}
        </div>
        <div
          className={BasicListStyles.standardList}
          style={{
            display: this.state.showCloudApp ? 'flex' : 'block',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Card
            className={BasicListStyles.listCard}
            bordered={false}
            title={
              <div>
                <span>内部市场</span>
                <Search
                  className={BasicListStyles.extraContentSearch}
                  placeholder="请输入名称进行搜索"
                  onSearch={this.handleSearch}
                />
              </div>
            }
            style={{
              transition: 'all .8s',
              width: '50%',
              display: 'inline-block',
            }}
            bodyStyle={{
              padding: '0 32px 40px 32px',
            }}
          >
            <List
              size="large"
              rowKey="ID"
              locale={{
                emptyText: (
                  <p style={{ paddingTop: 80, lineHeight: 1.3 }}>
                    暂无应用模型， 你可以
                    <br />
                    <br />
                    发布应用模型
                    {rainbondUtil.cloudMarketEnable(enterprise) && (
                      <span>
                        或<span style={{ color: '#1890ff' }}>从云端同步</span>
                      </span>
                    )}
                  </p>
                ),
              }}
              loading={this.state.loading}
              pagination={paginationProps}
              dataSource={componentList}
              renderItem={(item, index) => {
                const itemID = item.app_id;

                const renderItem = (
                  <List.Item actions={[this.getAction(item)]}>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={
                            item.pic ||
                            require('../../../public/images/app_icon.jpg')
                          }
                          shape="square"
                          size="large"
                          onClick={() => {
                            // this.showMarketAppDetail(item);
                          }}
                        />
                      }
                      title={
                        <a
                          style={{ color: '#384551' }}
                          onClick={() => {
                            // this.showMarketAppDetail(item);
                          }}
                        >
                          {item.app_name}
                        </a>
                      }
                      description={
                        <Tooltip title={item.describe}>
                          <span className={styles.desc}>{item.describe}</span>
                        </Tooltip>
                      }
                    />
                  </List.Item>
                );
                return renderItem;
              }}
            />
          </Card>
          <div
            style={{
              transition: 'all .8s',
              transform: this.state.showCloudApp
                ? 'translate3d(0, 0, 0)'
                : 'translate3d(100%, 0, 0)',
              marginLeft: 8,
              width: '49%',
            }}
          >
            <CloudApp
              eid={eid}
              onSyncSuccess={() => {
                this.handlePageChange(1);
              }}
            />
          </div>
        </div>
      </PageHeaderLayout>
    );
  }
}
