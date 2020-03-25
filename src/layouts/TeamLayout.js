import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Layout, Icon, message, notification, Button } from 'antd';
import DocumentTitle from 'react-document-title';
import { connect } from 'dva';
import { Route, Redirect, routerRedux } from 'dva/router';
import PageLoading from '../components/PageLoading';
import memoizeOne from 'memoize-one';
import { ContainerQuery } from 'react-container-query';
import classNames from 'classnames';
import { enquireScreen } from 'enquire-js';
import GlobalHeader from '../components/GlobalHeader';
import SiderMenu from '../components/SiderMenu';
import userUtil from '../utils/user';
import rainbondUtil from '../utils/rainbond';
import globalUtil from '../utils/global';
import cookie from '../utils/cookie';
import Authorized from '../utils/Authorized';
import { getMenuData } from '../common/teamMenu';
import { getAppMenuData } from '../common/appMenu';
import logo from '../../public/logo.png';
import GlobalRouter from '../components/GlobalRouter';
import Context from './MenuContext';
import { FormattedMessage } from 'umi-plugin-react/locale';
import TeamHeader from './components/TeamHeader';
import AppHeader from './components/AppHeader';
import AuthCompany from '../components/AuthCompany';

const qs = require('query-string');

const { Content } = Layout;

const query = {
  'screen-xs': {
    maxWidth: 575,
  },
  'screen-sm': {
    minWidth: 576,
    maxWidth: 767,
  },
  'screen-md': {
    minWidth: 768,
    maxWidth: 991,
  },
  'screen-lg': {
    minWidth: 992,
    maxWidth: 1199,
  },
  'screen-xl': {
    minWidth: 1200,
  },
};

let isMobile;
enquireScreen(b => {
  isMobile = b;
});

class TeamLayout extends React.PureComponent {
  static childContextTypes = {
    location: PropTypes.object,
    breadcrumbNameMap: PropTypes.object,
    currRegion: PropTypes.string,
    currTeam: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.getPageTitle = memoizeOne(this.getPageTitle);
    this.state = {
      isMobile,
      isInit: false,
      showWelcomeCreateTeam: false,
      canCancelOpenRegion: true,
      market_info: '',
      showAuthCompany: false,
      enterpriseList: [],
      ready: false,
      currentTeam: false,
      currentEnterprise: false,
      currentComponent: null,
      eid: '',
    };
  }

  componentDidMount() {
    this.getEnterpriseList();
  }

  // get enterprise list
  getEnterpriseList = () => {
    const { dispatch } = this.props;
    // 获取最新的用户信息
    dispatch({ type: 'user/fetchCurrent' });
    dispatch({
      type: 'global/fetchEnterpriseList',
      callback: res => {
        if (res && res._code === 200) {
          this.setState(
            {
              enterpriseList: res.list,
            },
            () => {
              this.getTeamOverview();
            }
          );
        }
      },
    });
  };
  getTeamOverview = () => {
    const { teamName, regionName } = this.props.match.params;
    if (teamName && regionName) {
      cookie.set('team_name', teamName);
      cookie.set('region_name', regionName);
      this.props.dispatch({
        type: 'global/getTeamOverview',
        payload: {
          team_name: teamName,
        },
        callback: res => {
          if (res && res._code == 200) {
            this.setState(
              {
                eid: res.bean.eid,
              },
              () => {
                this.load();
              }
            );
          }
        },
      });
    }
    return null;
  };
  load = () => {
    const { enterpriseList, eid } = this.state;
    const { currentUser, dispatch } = this.props;
    const { teamName, regionName } = this.props.match.params;
    const team = userUtil.getTeamByTeamName(currentUser, teamName);
    dispatch({ type: 'teamControl/fetchCurrentTeam', payload: team });
    dispatch({
      type: 'teamControl/fetchCurrentRegionName',
      payload: { currentRegionName: regionName },
    });
    dispatch({
      type: 'region/fetchProtocols',
      payload: { team_name: teamName, region_name: regionName },
    });
    const region = userUtil.hasTeamAndRegion(currentUser, teamName, regionName);
    enterpriseList.map(item => {
      if (eid == item.enterprise_id) {
        dispatch({ type: 'enterprise/fetchCurrentEnterprise', payload: item });
        this.setState({
          currentEnterprise: item,
          currentTeam: team,
          currentRegion: region,
          ready: true,
        });
      }
    });
    this.fetchEnterpriseInfo(eid);
    this.fetchTeamApps();
    enquireScreen(mobile => {
      this.setState({ isMobile: mobile });
    });
    // 连接云应用市场
    this.setState({ showAuthCompany: this.props.showAuthCompany });
    const query = qs.parse(this.props.location.search);
    if (query && query.market_info) {
      this.setState({ market_info: query.market_info });
      this.setState({ showAuthCompany: true });
    }
    this.queryComponentDeatil();
  };

  queryComponentDeatil = () => {
    const { teamName } = this.props.match.params;
    const componentID = globalUtil.getComponentID();
    if (componentID) {
      this.props.dispatch({
        type: 'appControl/fetchDetail',
        payload: {
          team_name: teamName,
          app_alias: componentID,
        },
        callback: appDetail => {
          this.setState({ currentComponent: appDetail.service });
        },
      });
    }
  };

  fetchTeamApps = () => {
    const { teamName, regionName } = this.props.match.params;
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: teamName,
        region_name: regionName,
      },
    });
  };

  fetchEnterpriseInfo = eid => {
    if (!eid) {
      return null;
    }
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseInfo',
      payload: {
        enterprise_id: eid,
      },
    });
  };

  getChildContext = () => {
    const { location } = this.props;
    return { location, breadcrumbNameMap: this.breadcrumbNameMap };
  };

  getPageTitle = pathname => {
    const { rainbondInfo } = this.props;
    const title =
      (rainbondInfo &&
        rainbondInfo.title &&
        rainbondInfo.title.enable &&
        rainbondInfo.title.value) ||
      'Rainbond | Serverless PaaS , A new generation of easy-to-use cloud management platforms based on kubernetes.';
    return title;
  };

  handleMenuCollapse = collapsed => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: collapsed,
    });
  };

  getContext() {
    const { location } = this.props;
    return {
      location,
      breadcrumbNameMap: this.breadcrumbNameMap,
    };
  }
  getMode(appID) {
    if (appID) {
      return 'app';
    }
    return 'team';
  }

  render() {
    const {
      currentUser,
      collapsed,
      children,
      location: { pathname },
      nouse,
      rainbondInfo,
      enterprise,
    } = this.props;
    const {
      enterpriseList,
      ready,
      currentEnterprise,
      currentTeam,
      currentRegion,
      currentComponent,
    } = this.state;
    const { teamName, regionName } = this.props.match.params;
    const autoWidth = collapsed ? 'calc(100% - 416px)' : 'calc(100% - 116px)';
    // Parameters of the abnormal
    if (!teamName || !regionName) {
      return <Redirect to="/" />;
    }
    // The necessary data is loaded
    if (!ready || !currentEnterprise || !currentTeam) {
      return <PageLoading />;
    }
    if (teamName != (currentTeam && currentTeam.team_name)) {
      this.load();
    }

    cookie.set('team_name', teamName);
    cookie.set('region_name', regionName);
    const componentID = globalUtil.getComponentID();
    let appID = globalUtil.getAppID();
    // currentComponent is exit and id is current componentID
    if (currentComponent && currentComponent.service_alias == componentID) {
      appID = currentComponent.group_id;
      // Refresh the component information
    } else if (componentID) {
      this.queryComponentDeatil();
      return <PageLoading />;
    } else {
      this.setState({ currentComponent: null });
    }

    const mode = this.getMode(appID || componentID);
    const customHeader = () => {
      if (mode == 'team') {
        return (
          <TeamHeader
            teamName={teamName}
            currentEnterprise={currentEnterprise}
            currentTeam={currentTeam}
            currentRegion={currentRegion}
            regionName={regionName}
          />
        );
      }
      return (
        <AppHeader
          teamName={teamName}
          currentEnterprise={currentEnterprise}
          currentTeam={currentTeam}
          currentRegion={currentRegion}
          regionName={regionName}
          appID={appID}
          currentComponent={currentComponent}
          componentID={componentID}
        />
      );
    };
    let menuData = getMenuData(teamName, regionName);
    if (mode == 'app') {
      menuData = getAppMenuData(teamName, regionName, appID);
    }
    const layout = () => {
      const team = userUtil.getTeamByTeamName(currentUser, teamName);
      const hasRegion =
        team && team.region && team.region.length && currentRegion;
      let isRegionMaintain = false;
      if (hasRegion) {
        isRegionMaintain =
          currentRegion.region_status === '3' &&
          !userUtil.isSystemAdmin(currentUser);
      } else {
        return <Redirect to="/" />;
      }
      const renderContent = () => {
        // 集群维护中
        if (isRegionMaintain || nouse) {
          return (
            <div style={{ textAlign: 'center', padding: '200px 0' }}>
              <Icon
                style={{ fontSize: 40, marginBottom: 32, color: 'red' }}
                type="warning"
              />
              <h1
                style={{
                  fontSize: 40,
                  color: 'rgba(0, 0, 0, 0.65)',
                  marginBottom: 20,
                }}
              >
                {nouse ? '当前授权已过期' : '集群维护中'}
              </h1>
              <p
                style={{
                  fontSize: 20,
                }}
              >
                {nouse
                  ? '请联系 010-64666786 获取更多商业服务。'
                  : '请稍后访问当前集群'}
              </p>
            </div>
          );
        }

        return (
          <div>
            <Authorized
              logined
              authority={['admin', 'user']}
              noMatch={<Redirect to="/user/login" />}
            >
              {children}
            </Authorized>
          </div>
        );
      };
      return (
        <Layout>
          <SiderMenu
            enterpriseList={enterpriseList}
            currentEnterprise={currentEnterprise}
            currentTeam={currentTeam}
            currentUser={currentUser}
            logo={fetchLogo}
            Authorized={Authorized}
            collapsed={collapsed}
            location={location}
            isMobile={this.state.isMobile}
            onCollapse={this.handleMenuCollapse}
          />
          <Layout>
            <GlobalHeader
              key={
                currentEnterprise.enterprise_id +
                currentTeam.team_name +
                currentRegion.team_region_name +
                appID
              }
              logo={fetchLogo}
              isPubCloud={
                rainbondInfo &&
                rainbondInfo.is_public &&
                rainbondInfo.is_public.enable
              }
              currentUser={currentUser}
              collapsed={collapsed}
              onCollapse={this.handleMenuCollapse}
              isMobile={this.state.isMobile}
              customHeader={customHeader}
            />
            <Layout style={{ flexDirection: 'row' }}>
              <GlobalRouter
                enterpriseList={enterpriseList}
                title={
                  rainbondInfo &&
                  rainbondInfo.title &&
                  rainbondInfo.title.enable &&
                  rainbondInfo.title.value
                }
                currentUser={currentUser}
                Authorized={Authorized}
                collapsed={collapsed}
                location={location}
                isMobile={this.state.isMobile}
                onCollapse={this.handleMenuCollapse}
                menuData={menuData}
                pathname={pathname}
                showMenu={!componentID}
              />
              <Content
                style={{
                  margin: '24px 24px 0',
                  height: '100%',
                  width: autoWidth,
                }}
              >
                {renderContent()}
              </Content>
            </Layout>
          </Layout>
        </Layout>
      );
    };
    const fetchLogo =
      rainbondUtil.exportAppEnable(rainbondInfo, enterprise) || logo;

    return (
      <Fragment>
        <DocumentTitle title={this.getPageTitle(pathname)}>
          <ContainerQuery key={teamName + regionName} query={query}>
            {params => (
              <Context.Provider value={this.getContext()}>
                <div className={classNames(params)}>{layout()}</div>
              </Context.Provider>
            )}
          </ContainerQuery>
        </DocumentTitle>
        {/* 企业尚未认证 */}
        {(this.props.showAuthCompany || this.state.showAuthCompany) && (
          <AuthCompany
            eid={this.state.eid}
            market_info={this.state.market_info}
            onOk={() => {
              const jumpPath = this.props.location.pathname;
              const query = this.props.location.search.replace(
                `market_info=${this.state.market_info}`,
                ''
              );
              this.setState({ market_info: '', showAuthCompany: false });
              this.props.dispatch(routerRedux.replace(jumpPath + query));
              window.location.reload();
            }}
          />
        )}
      </Fragment>
    );
  }
}

export default connect(({ user, global, index, loading }) => ({
  currentUser: user.currentUser,
  notifyCount: user.notifyCount,
  collapsed: global.collapsed,
  groups: global.groups,
  fetchingNotices: loading.effects['global/fetchNotices'],
  notices: global.notices,
  rainbondInfo: global.rainbondInfo,
  payTip: global.payTip,
  memoryTip: global.memoryTip,
  noMoneyTip: global.noMoneyTip,
  showAuthCompany: global.showAuthCompany,
  overviewInfo: index.overviewInfo,
  nouse: global.nouse,
  enterprise: global.enterprise,
}))(TeamLayout);
