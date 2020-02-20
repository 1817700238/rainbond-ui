import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import { Button } from "antd";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import globalUtil from "../../utils/global";
import ImageName from "./image-name";
import ImageCmd from "./image-cmd";
import ImageCompose from "./image-compose";

@connect(
  ({ user, groupControl }) => ({}),
  null,
  null,
  { pure: false },
)
export default class Main extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {};
  }
  componentDidMount() {}
  componentWillUnmount() {}
  handleTabChange = (key) => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/image/${key}`));
  };
  render() {
    const {} = this.props;

    const map = {
      custom: ImageName,
      dockerrun: ImageCmd,
      Dockercompose: ImageCompose,
    };

    const tabList = [
      {
        key: "custom",
        tab: "指定镜像",
      },
      {
        key: "dockerrun",
        tab: "DockerRun命令",
      },
      {
        key: "Dockercompose",
        tab: "DockerCompose",
      },
    ];

    const { match, routerData, location } = this.props;
    let type = this.props.match.params.type;
    if (!type) {
      type = "custom";
    }
    const Com = map[type];

    return (
      <PageHeaderLayout
        breadcrumbList={[
          {
            title: "首页",
            href: "/",
          },
          {
            title: "创建组件",
            href: "",
          },
          {
            title: "从Docker镜像创建组件",
            href: "",
          },
        ]}
        title="从Docker镜像创建组件"
        onTabChange={this.handleTabChange}
        content="支持从单一镜像、Docker命令、Docker-Compose配置创建应用"
        tabActiveKey={type}
        tabList={tabList}
      >
        {Com ? <Com {...this.props} /> : "参数错误"}
      </PageHeaderLayout>
    );
  }
}
